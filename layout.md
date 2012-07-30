    bin/server.js -- configures a default server to run with reasonable settings using the default webclient

    server/ -- server components
    server/package.json -- to install server only
    server/server.js -- instead of index.js to avoid confusion

    browser/ -- browser components
    browser/package.json -- to install client only
    browser/app.js -- instead of index.js to avoid confusion
    browser/lib -- for javascript
    browser/style.less
    browser/styles -- for included styleshees
    browser/index.jade -- for the app
    browser/includes -- for templates / includes

    public/ -- compiled version of browser
    var/public/ -- where to put uploads, downloads, etc - stuff that doesn't get built

    cli/ -- commandline tools
    cli/package.json -- to install commandline tools only

    package.json -- to install all the things
        -- include install hooks to lib, browser, and cli
