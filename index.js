const core = require('@actions/core');
const github = require('@actions/github');

console.log(github.context);

// exit early
if (!['pull_request_target', 'pull_request'].includes(github.context.eventName)) {
  core.setFailed('action triggered outside of a pull_request')
  process.exit(1)
}

try {
  console.log(`Yah`);
} catch (error) {
  core.setFailed(error.message);
}
