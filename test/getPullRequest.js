const { octokit } = require("./octokit");
const { findPullRequest } = require("../lib/getPullRequest");

async function test() {
  const pr =  await findPullRequest(octokit, "nugit/nugit-visualization", "0559c0fa0");
  console.log('pr', pr);
}

test();
