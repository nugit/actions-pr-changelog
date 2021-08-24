const { getMergeCommits } = require('../lib/mergeCommits');

const commits = getMergeCommits('master', 'develop');

console.log(commits);
