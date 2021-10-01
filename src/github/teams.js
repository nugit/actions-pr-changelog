async function getTeamSlugs(octokit, owner) {
  const result = await octokit.rest.teams.list({
    org: owner,
  });

  return result.data.map(t => t.slug);
}

async function getMembers(octokit, owner, slug) {
  const result = await octokit.rest.teams.listMembersInOrg({
    org: owner,
    team_slug: slug,
  });

  return result.data.map(m => m.login);
}

async function getReviewers(octokit, owner, userOrTeamIds) {
  const data = await Promise.all(
    userOrTeamIds.map((userOrTeamId) => {
      if (!userOrTeamId.startsWith(`@${owner}/`)) {
        return [userOrTeamId];
      }
      const [, slug] = userOrTeamId.split('/');
      return getMembers(octokit, owner, slug);
    }),
  );

  const result = new Set(data.flat());
  return Array.from(result.values());
}

module.exports = {
  getMembers,
  getTeamSlugs,
  getReviewers,
};
