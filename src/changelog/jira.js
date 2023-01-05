function findJiraTicket(prs) {
  const lines = prs.flatMap(pr => (pr.body ? pr.body.split('\n') : []));

  const linesMap = lines
    .filter(line => line.includes('atlassian.net'))
    .reduce((acc, line) => {
      const match = line.match(
        /https:\/\/nugitco.atlassian.net\/browse\/(\w+-\w+)/,
      );

      if (match) {
        const jiraTicketNo = match[1];

        if (!acc.has(jiraTicketNo)) {
          acc.set(jiraTicketNo, line);
        }
      }

      return acc;
    }, new Map());

  return Array.from(linesMap.values());
}

module.exports = {
  findJiraTicket,
};
