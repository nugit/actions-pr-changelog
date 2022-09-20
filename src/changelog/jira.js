function findJiraTicket(prs) {
  const lines = prs.flatMap(pr => (pr.body ? pr.body.split('\n') : []));
  const linesMap = new Map(
    lines
      .filter(line => line.includes('atlassian.net'))
      .map((line) => {
        const match = line.match(
          /https:\/\/nugitco.atlassian.net\/browse\/(\w+-\w+)/,
        );
        return match ? [match[1], line] : null;
      }),
  );

  return Array.from(linesMap.values());
}

module.exports = {
  findJiraTicket,
};
