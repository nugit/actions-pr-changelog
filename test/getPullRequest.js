const { octokit } = require("./octokit");
const { getPullRequest } = require("../lib/getPullRequest");

async function test() {
  console.log(
    await getPullRequest(octokit, "nugit/nugit-visualization", "0559c0fa0")
  );
}

test();
