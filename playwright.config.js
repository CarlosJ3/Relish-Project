const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 35_000,          
  retries: 1,                
  reporter: "list",
  use: {
    headless: false,                    
    channel: "chrome",                  
    slowMo: 600,                        
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    viewport: { width: 1280, height: 800 },
  },
  projects: [
    { name: "chrome-headed", use: { ...devices["Desktop Chrome"] } },
  ],
});
