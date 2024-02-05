const fs = require('fs');
const CDP = require('chrome-remote-interface');
const { prepareHtmlForPrerender } = require('../utils/process-html');
const { blockedResources } = require('../utils/blockResources');

class Page {
    constructor(params) {
        const { frameId, targetUrl, userAgent, debuggingPort } = params;

        this.frameId = frameId;
        this.targetUrl = targetUrl;
        this.pageContent = undefined;
        this.pendingRequests = [];
        this.userAgent = userAgent;
        this.isPageLoaded = false;
        this.debuggingPort = debuggingPort;
    }

    async connectToTab() {
        this.pageInstance = await CDP({
            target: this.frameId,
            port: this.debuggingPort,
        });
    }

    async closeConnection() {
        const { Page } = this.pageInstance;

        await Page.close({ frameId: this.frameId });
    }

    async startEvents() {
        const { Page, Network, DOM, Runtime, Emulation, Animation } =
            this.pageInstance;

        await Promise.all([
            Page.enable(),
            Network.enable(),
            DOM.enable(),
            Runtime.enable(),
            Animation.enable(),
        ]);

        await Emulation.setDeviceMetricsOverride({
            width: 1920,
            height: 1080,
            fitWindow: true,
            deviceScaleFactor: 1,
            mobile: false,
        });

        await Emulation.setUserAgentOverride({
            userAgent: this.userAgent,
        });

        // Disabling cache
        await Network.setBypassServiceWorker({ bypass: true });

        // Disable animation to not waist time on its render and CPU load.
        await Animation.setPlaybackRate({ playbackRate: 0 });
    }

    async waitForPageToFullRender() {
        const { Network, Runtime, Page } = this.pageInstance;

        // Start blocking resources
        await this.handleBlockResources({ Network });

        // Starting gathering pending requests
        this.gatherPendingNetworkRequests({ Network });

        // Wait initial load event fire
        await Page.loadEventFired();

        // Double check for for document to load
        await this.waitForPageLoad({ Runtime });
        await this.waitForNoPendingRequests();

        // Require to avoid issues with web socket being disabled
        await Network.disable();

        // Wait for some period after all of requests done to let JS execute all necessary tasks
        await this.waitForNextTimeCheck(
            process.env['TIMEOUT_FOR_PAGE_FULLY_LOAD']
        );
    }

    async handleBlockResources({ Network }) {
        // Starts to intercept all requests
        await Network.setRequestInterception({
            patterns: [{ urlPattern: '*' }],
        });

        // Logic to decide on which request to allow/abort
        Network.requestIntercepted(({ interceptionId, request }) => {
            let shouldBlock = false;
            blockedResources.forEach((substring) => {
                if (request.url.indexOf(substring) >= 0) {
                    shouldBlock = true;
                }
            });

            Network.continueInterceptedRequest({
                interceptionId,
                errorReason: shouldBlock ? 'Aborted' : undefined,
            });
        });
    }

    /*
     * For some reason in headless mode event for Page loadEventFired
     * sometimes is not fired, which makes endless wait for page to be loaded.
     * This is hack to wait for get document load state.
     */
    async waitForPageLoad({ Runtime }) {
        while (!this.isPageLoaded) {
            const { result: { value } = {} } = await Runtime.evaluate({
                expression: 'document.readyState',
            });
            this.isPageLoaded = value === 'complete';

            await this.waitForNextTimeCheck(500);
        }
    }

    // Set up event listeners for network events
    gatherPendingNetworkRequests({ Network }) {
        Network.requestWillBeSent((request) => {
            const {
                type,
                requestId,
                request: { url },
            } = request;
            if (
                (type === 'Fetch' && url.includes('graphql')) ||
                type === 'Image'
            ) {
                this.pendingRequests.push(requestId);
            }
        });

        Network.responseReceived((request) => {
            const { requestId } = request;

            this.removePendingRequest(requestId);
        });

        Network.loadingFailed((request) => {
            const { requestId } = request;

            this.removePendingRequest(requestId);
        });
    }

    removePendingRequest(requestId) {
        const index = this.pendingRequests.indexOf(requestId);

        if (index !== -1) {
            this.pendingRequests.splice(index, 1);
        }
    }

    async waitForNextTimeCheck(timeForWaiting) {
        await new Promise((resolve) => setTimeout(resolve, timeForWaiting));
    }

    async waitForNoPendingRequests() {
        let checkTries = 0;
        let prevPendingRequests = [];

        while (this.pendingRequests.length > 0 && checkTries < 10) {
            if (
                JSON.stringify(this.pendingRequests) ===
                JSON.stringify(prevPendingRequests)
            ) {
                checkTries++;
            } else {
                checkTries = 0;
                prevPendingRequests = this.pendingRequests;
            }

            // Wait for a defined interval before checking again
            await new Promise((resolve) =>
                setTimeout(
                    resolve,
                    process.env['TIMEOUT_FOR_PENDING_REQUEST_CHECK']
                )
            );
        }
    }

    async setPageContent() {
        const { DOM } = this.pageInstance;
        const { root } = await DOM.getDocument();

        // Get the outer HTML of the root document node
        const { outerHTML } = await DOM.getOuterHTML({ nodeId: root.nodeId });
        const { origin } = new URL(this.targetUrl);

        this.pageContent = prepareHtmlForPrerender(outerHTML, origin);
    }

    async takeScreenshot({ Page, targetUrl }) {
        // Capture a screenshot
        const { data } = await Page.captureScreenshot({ format: 'jpeg' });

        const { pathname } = new URL(targetUrl);

        // Make screenshot for test
        fs.writeFileSync(
            `./var/screenshots/${pathname.replace(/\//g, '-')}.png`,
            Buffer.from(data, 'base64')
        );
    }
}

module.exports = { Page };
