const { updateReleasePR, updateOnPremPR } = require("../lib/pr");
const { octokit } = require("./octokit");

async function testUpdateReleasePR() {
  const owner = "nugit";
  const repo = "nugit-visualization";
  const prNumber = 2665;

  await updateReleasePR(octokit, owner, repo, prNumber);
}

testUpdateReleasePR();

async function testUpdateOnPremPR() {
  const owner = "nugit";
  const repo = "nugit-visualization";
  const prNumber = 2623;

  await updateOnPremPR(octokit, owner, repo, prNumber);
}

testUpdateOnPremPR();
