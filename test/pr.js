const { updateReleasePR } = require("../lib/pr");
const { octokit } = require("./octokit");

async function testUpdateReleasePR() {
  const owner = "nugit";
  const repo = "nugit-visualization";
  const prNumber = 2665;

  await updateReleasePR(octokit, owner, repo, prNumber);
}

testUpdateReleasePR();
