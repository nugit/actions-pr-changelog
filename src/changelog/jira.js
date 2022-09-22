function findJiraTicket(prs) {
  const lines = prs.flatMap(pr => (pr.body ? pr.body.split('\n') : []));

  const linesMap = new Map(
    lines
      .filter(line => line.includes('atlassian.net'))
      .reduce((acc, line) => {
        const match = line.match(
          /https:\/\/nugitco.atlassian.net\/browse\/(\w+-\w+)/,
        );

        if (match) {
          acc.push([match[1], line]);
        }

        return acc;
      }, []),
  );

  return Array.from(linesMap.values());
}

module.exports = {
  findJiraTicket,
};
