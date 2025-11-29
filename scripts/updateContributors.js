const fs = require('fs');
const axios = require('axios');

const repoOwner = 'Emiliano-S-M';
const repoName = 'Proyecto-Sistema-Gestion-Escolar';
const readmePath = 'README.md';
const token = process.env.GITHUB_TOKEN;

// Función para obtener contribuyentes
async function getContributors() {
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contributors`;
    const res = await axios.get(url, {
        headers: { Authorization: `token ${token}` }
    });
    return res.data;
}

// Función para contar PRs e Issues de cada contribuidor
async function getStats(user) {
    const prUrl = `https://api.github.com/search/issues?q=repo:${repoOwner}/${repoName}+type:pr+author:${user}`;
    const issueUrl = `https://api.github.com/search/issues?q=repo:${repoOwner}/${repoName}+type:issue+author:${user}`;
    
    const [prRes, issueRes] = await Promise.all([
        axios.get(prUrl, { headers: { Authorization: `token ${token}` } }),
        axios.get(issueUrl, { headers: { Authorization: `token ${token}` } }),
    ]);

    return {
        prs: prRes.data.total_count,
        issues: issueRes.data.total_count
    };
}

// Generar tabla Markdown
async function generateTable() {
    const contributors = await getContributors();
    let table = '| Contribuidor | Commits | Pull Requests | Issues |\n';
    table += '|--------------|--------|---------------|--------|\n';

    for (let c of contributors) {
        const stats = await getStats(c.login);
        table += `| [![avatar](https://avatars.githubusercontent.com/u/${c.id}?s=40)](${c.html_url}) **${c.login}** | ${c.contributions} | ${stats.prs} | ${stats.issues} |\n`;
    }
    return table;
}

// Reemplazar sección en README
async function updateReadme() {
    const table = await generateTable();
    let readme = fs.readFileSync(readmePath, 'utf8');

    const start = '<!-- STATS-LIST:START -->';
    const end = '<!-- STATS-LIST:END -->';

    const regex = new RegExp(`${start}[\\s\\S]*${end}`, 'm');
    const newSection = `${start}\n\n${table}\n${end}`;

    if (readme.match(regex)) {
        readme = readme.replace(regex, newSection);
    } else {
        readme += `\n\n${newSection}`;
    }

    fs.writeFileSync(readmePath, readme);
    console.log('README actualizado con contribuyentes y estadísticas');
}

updateReadme();
