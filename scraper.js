const cheerio = require("cheerio");
const axios = require("axios");
const fs = require("fs");

const CSVToJSON = require("csvtojson")
const JSONToCSV = require("json2csv").parse

async function fetchHtml(url) {
    try {
        const { data } = await axios.get(url);
        return data
    } catch(e) {
        console.log("Error", e)
    }
}


async function getAllLinks() {
    var links = fs.readFileSync("./data/links.json")
    links = JSON.parse(links)
    let i = 0
    var secound = links.length
    var newLinks = []

    while(true){
        const html =  await fetchHtml(`https://www.realitica.com/?cur_page=${i}&for=Najam&pZpa=Crna+Gora&pState=Crna+Gora&type%5B%5D=&lng=hr`);
        const $ = cheerio.load(html)

        let links1 = []

        $('body').find(".thumb_div a").each((i, el) => {
            let url = $(el).attr('href')
            links1.push(url)
        })

        var fb = false

        for(let j=0; j<links1.length; j++){
            if (secound != 0) {
                for(let g=0; g<secound; g++){
                    if(links1[j] == links[g]){
                        fb = true
                        break;
                    } else if(g == secound-1){
                        let link = links1[j]
                        links.push(link)
                        newLinks.push(link)
                    }
                }
            }  
            else {
                let link = links1[j]
                links.push(link)
                newLinks.push(link)
            } 
        }

        if (links1.length == 0) {
            fb = true
        }

        if(fb == true){
            break;
        }
        i++
    }

    links = JSON.stringify(links, null, 4)
    fs.writeFileSync("./data/links.json", links, (err) => {
        if(err){
            console.log(err)
        }
    })

    getDataFromLinks(newLinks)
}

async function getDataFromLinks(newLinks) {
    let links = newLinks
    var finished = []

    for(let i=0; i<links.length; i++){
        console.log(i)
        const html =  await fetchHtml(links[i]);
        const $ = cheerio.load(html)

        let key = $('body').find("#listing_body strong").toArray().map(element => $(element).text())
        let textS = $('body').find("#listing_body").toArray().map(element => $(element).text()).toString().replace(/\n/g, "").replace(/\t/g, "")

        let keyIndex = []
        let keyEnd = []

        for(let j=0; j<key.length; j++){
            let index = textS.search(key[j])
            keyIndex.push(index)
            let indexEnd = index + key[j].length
            keyEnd.push(indexEnd)
        }

        keyIndex.push(textS.length-1)
        let pageKeys = []
        let pageText = []

        for(let g = 0; g < keyEnd.length; g++) {
            pageKeys.push(textS.slice(keyIndex[g], keyEnd[g]))
            pageText.push(textS.slice(keyEnd[g]+2, keyIndex[g+1]))
        }

        let imageURL = []

        $('body').find(".fancybox img").each((i, el) => {
            let url = $(el).attr('src')
            imageURL.push(url)
        })

        var sites = {
            link: links[i]
        }

        for(let r = 0; r < pageKeys.length; r++) {
            sites[`${pageKeys[r]}`] = pageText[r]
        }

        sites["imageURL"] = imageURL

        finished.push(sites)
    }

    CSVToJSON().fromFile("./data/final.csv").then(source => {
        finished.forEach(element => {
            source.push(element)
        });

        const csv = JSONToCSV(source)
        fs.writeFileSync("./data/final.csv", csv)
    })
}



async function scrapApartmani() {
    getAllLinks()
}

module.exports = scrapApartmani