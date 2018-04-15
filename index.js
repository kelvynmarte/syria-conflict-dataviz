var request = require('request');
var turf = require('@turf/turf');
var fs = require('fs');

var syriaGeoJson = JSON.parse(fs.readFileSync('data/syria.geojson', 'utf8'));


let result = 2
console.log('hello')
// console.log(`The result is: ${result}`)
var results = [];
var totalArea = 0;
// https://syria.liveuamap.com/ajax/do?act=getFields&time=1515020400&resid=3&lang=en&isUserReg=0
request('https://syria.liveuamap.com/ajax/do?act=getFields&time=1451602800&resid=3&lang=en&isUserReg=0', function (error, response, body) {
    //   console.log('error:', error); // Print the error if one occurred
    //   console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
    let jb = JSON.parse(body);
    // console.log('body:', jb); // Print the HTML for the Google homepage.
    // console.log(jb)
    for (var key in jb.fields) {
        // skip loop if the property is from prototype
        if (!jb.fields.hasOwnProperty(key)) continue;
        // console.log(key);
        console.log(jb.fields[key].name);
        console.log(jb.fields[key].description);
        console.log(jb.fields[key].strokecolor);
        var features = [];
        let featuresIndex = 0;
        jb.fields[key].points.forEach((pts) => {
            let subfeature = []
            for (let index = 0; index+2 < pts.length; index+=2) {
                // const element = [pts[index],pts[index+1]];
                subfeature.push([pts[index],pts[index+1]]);
                // console.log([pts[index],pts[index+1]]);
            }
            subfeature.push(subfeature[0])
            // features[featuresIndex] = []
            // console.log(featuresIndex)
            if(subfeature.length > 8) features[featuresIndex++] = subfeature
        });

        if(typeof features[0] != 'undefined' && features.length >= 1){
            var polygon = turf.polygon(features);
            var area = turf.area(polygon);
        }
        results.push(
            {
                name: jb.fields[key].name,
                description: jb.fields[key].description,
                areaOriginal: area,
                area: Math.abs(Math.round(area/1000))
            }
        )
        totalArea += Math.abs(Math.round(area/1000))
        console.log(area)
        // console.log(Math.round(area/1000) + 'km2')
    }

    results.forEach(element => {
        element.percent = Math.round(element.area * 100 / totalArea);
        console.log(`${element.name} : ${element.area} km : ${element.percent}`)
    });

});


