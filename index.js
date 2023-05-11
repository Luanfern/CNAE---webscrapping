const pup = require('puppeteer');
const url = "https://www.contabilizei.com.br/contabilidade-online/tabela-simples-nacional-completa/#tabela-completa-simples-nacional";
const fs = require('fs');

(async () => {
    const browser = await pup.launch({
        headless: 'new'
    });
    const page = await browser.newPage();
    console.log('init');

    await page.goto(url);
    console.log('url');

    await page.waitForSelector('tbody#tableSimplesNacional');
    const result = await page.$$eval('#tableSimplesNacional > tr', rows => {
        return Array.from(rows, row => {
            const columns = row.querySelectorAll('td')
            return Array.from(columns, column => column.innerHTML);
        });
    });

    delete result[0]

    var listCNAES = result.map((v) => {
        var obj = {
            'CNAE': v[0].replace(/<[^>]+>/g, '') ?? '--',
            'Descricao': v[1]?.replace(/<[^>]+>/g, '') ?? '--',
            'Anexo': v[2] ?? '--',
            'Fator_R': v[3] ?? '--',
            'Aliquota': v[4] ?? '--',
            'Contabilizei': v[5] ?? '--',
        }
        if (v[1] != null) return obj
    })

    listCNAES = listCNAES.filter(v => v != null)

    function verifyEquals(vs) {
        var dif = false
        var preval = vs[0]
        vs.map((v) => {
            if (v != preval) dif = true
        })
        if (dif == false) {
            return vs[0]
        } else {
            return vs
        }
    }

    var newList = {
        'cnaes': []
    };
    var cnaesverifieds = [];
    listCNAES.map((v) => {
        if (cnaesverifieds.findIndex(cv => cv == v.CNAE) == -1) {
            cnaesverifieds.push(v.CNAE)
            var element = listCNAES.filter(el => { if (el.CNAE == v.CNAE && el != v) return el })
            var objUnified = {
                'CNAE': v.CNAE,
                'Descricao': verifyEquals([v.Descricao].concat(element.map(v => v.Descricao))),
                'Anexo': verifyEquals([v.Anexo].concat(element.map(v => v.Anexo))),
                'Fator_R': verifyEquals([v.Fator_R].concat(element.map(v => v.Fator_R))),
                'Aliquota': verifyEquals([v.Aliquota].concat(element.map(v => v.Aliquota))),
                'Contabilizei': verifyEquals([v.Contabilizei].concat(element.map(v => v.Contabilizei))),
            }
            newList.cnaes.push(objUnified)
        }
    })

    var jsonlistConvert = JSON.stringify(newList)
    fs.writeFile('lista_CNAES_Utils.json', jsonlistConvert, 'utf8', () => { });

    await page.setDefaultTimeout(5000)
    await browser.close();
})();