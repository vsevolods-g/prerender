const fs = require('fs');
const CDP = require('chrome-remote-interface');
const { Page } = require('./page');
const puppeteer = require('puppeteer');

class Chrome {
    constructor() {
        // Browser settings
        this.chromePath = process.env['CHROME_APPLICATION_PATH'];
        this.userAgent = process.env['DEFAULT_USER_AGENT'];
        this.debuggingPort = process.env['CHROME_REMOTE_DEBUGGING_PORT'];
        this.chromeInstanceOptions = [
            '--disable-gpu',
            '--headless',
            '--hide-scrollbars',
            '--new-window',
            '--enable-resource-load-scheduler=false',
            '--no-sandbox',
            '--disable-audio',
            '--disable-breakpad',
            '--disable-audio-output',
            '--disable-extensions',
            '--autoplay-policy=user-gesture-required',
            '--disable-background-networking',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-client-side-phishing-detection',
            '--disable-component-update',
            '--disable-default-apps',
            '--disable-dev-shm-usage',
            '--disable-domain-reliability',
            '--disable-features=AudioServiceOutOfProcess',
            '--disable-hang-monitor',
            '--disable-ipc-flooding-protection',
            '--disable-notifications',
            '--disable-offer-store-unmasked-wallet-cards',
            '--disable-popup-blocking',
            '--disable-print-preview',
            '--disable-prompt-on-repost',
            '--disable-renderer-backgrounding',
            '--disable-setuid-sandbox',
            '--disable-speech-api',
            '--disable-sync',
            '--hide-scrollbars',
            '--ignore-gpu-blacklist',
            '--metrics-recording-only',
            '--mute-audio',
            '--no-default-browser-check',
            '--no-first-run',
            '--no-pings',
            '--no-zygote',
            '--password-store=basic',
            '--use-gl=swiftshader',
            '--use-mock-keychain',
            '--remote-debugging-port=' + this.debuggingPort,
        ];

        this.browserInstance = undefined;
        this.browser = undefined;
        this.clientConnected = false;
        this.pagesStatusCode = {};
    }

    setUserAgent(userAgent) {
        this.userAgent = userAgent;
    }

    deleteStatusCode(url) {
        try {
            delete this.pagesStatusCode[url];
        } catch (e) {
            console.log(e);
        }
    }

    async startBrowser() {
        if (!fs.existsSync(this.chromePath)) {
            console.log(
                'unable to find Chrome install. Please specify with chromeLocation'
            );
            process.exit(1);
        }

        if (!this.browserInstance) {
            this.browserInstance = await puppeteer.launch({
                headless: 'new',
                dumpio: true,
                args: this.chromeInstanceOptions,
            });
        }
    }

    connectDevTools() {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                if (!this.clientConnected) {
                    console.log(
                        'unable to connect Chrome Devtools Protocol to browser'
                    );
                }
            }, 20 * 1000);

            const connect = () => {
                CDP.Version({ port: this.debuggingPort })
                    .then((info) => {
                        clearTimeout(timeout);

                        this.webSocketDebuggerURL =
                            info.webSocketDebuggerUrl ||
                            'ws://localhost:' +
                                this.debuggingPort +
                                '/devtools/browser';
                        this.clientConnected = true;
                        resolve();
                    })
                    .catch((err) => {
                        console.log(err);
                        console.log('retrying connection to Chrome...');
                        return setTimeout(connect, 1000);
                    });
            };

            setTimeout(connect, 500);
        });
    }

    async openNewTab({ targetUrl }) {
        try {
            const frameId = await this.connectToTab({ targetUrl });
            // Attach devtools to new create tab
            const page = new Page({
                frameId,
                userAgent: this.userAgent,
                targetUrl,
                debuggingPort: this.debuggingPort,
            });

            await page.connectToTab();
            await page.startEvents();
            await page.waitForPageToFullRender();
            await page.setPageContent();

            await page.closeConnection();

            return page;
        } catch (e) {
            console.log('error opening new tab: ', e);
        }

        return page;
    }

    async connectToTab({ targetUrl }) {
        try {
            if (!this.browser) {
                const browser = await CDP({
                    target: this.webSocketDebuggerURL,
                    port: this.debuggingPort,
                });
                this.browser = browser;
            }

            const { browserContextId } =
                await this.browser.Target.createBrowserContext();
            const { browserContextIds } =
                await this.browser.Target.getBrowserContexts();
            const { targetId } = await this.browser.Target.createTarget({
                url: 'about:blank',
                browserContextId: browserContextIds[0] || browserContextId,
            });
            const { Page, Network } = await CDP({
                target: targetId,
                port: this.debuggingPort,
            });

            await Promise.all([Page.enable(), Network.enable()]);

            Network.responseReceived((request) => {
                const {
                    type,
                    response: { status, url },
                } = request;

                if (type === 'Document' && targetUrl === url) {
                    this.pagesStatusCode[targetUrl] = status;
                }
            });

            const { frameId } = await Page.navigate({ url: targetUrl });

            return frameId;
        } catch (e) {
            console.log(`Error connecting to tab: ${e}`);
        }
    }
}

module.exports = { Chrome };
