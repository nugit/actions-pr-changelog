const { findPullRequest } = require('../lib/getPullRequest');
const { octokit } = require('./octokit');

async function test() {
  const pr = await findPullRequest(octokit, 'nugit/nugit-visualization', '0559c0fa0');
  console.log('pr', pr);
}

test();
