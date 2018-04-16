var request = require('request');
var turf = require('@turf/turf');
var fs = require('fs');

const truncateOptions = {
    precision: 3,
    coordinates: 2
};

const syriaGeoJson = JSON.parse(fs.readFileSync('data/syria_simple.geojson', 'utf8'))
// console.log(syriaGeoJson.geometry.coordinates)
// syriaGeoJson.geometry.coordinates[]
var syriaPolygon = turf.polygon(turf.truncate(syriaGeoJson, truncateOptions).geometry.coordinates)
var syriaArea = turf.area(syriaPolygon)


// var options = {tolerance: 0.01, highQuality: false}
// var simplifiedSyriaPolygon = turf.simplify(syriaGeoJson, options)

// console.log('hello ' + syriaArea)
// 'https://syria.liveuamap.com/ajax/do?act=getFields&time=1451602800&resid=3&lang=en&isUserReg=0'
var request = request.defaults({
    timeout: 1000
})
var getRelativeAreas = function (rdate, callback) {
    var results = [];
    var totalArea = 0;
    request(`https://syria.liveuamap.com/ajax/do?act=getFields&time=${rdate.getTime()/1000}&resid=3&lang=en&isUserReg=0`, function (error, response, body) {
        //   console.log('error:', error); // Print the error if one occurred
        //   console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        if (typeof body == 'undefined') {
            printData();
            return;
        }
        let jb = JSON.parse(body);
        // console.log('body:', jb); // Print the HTML for the Google homepage.
        // console.log(jb)
        for (var key in jb.fields) {
            // skip loop if the property is from prototype
            if (!jb.fields.hasOwnProperty(key)) continue;
            // console.log(key);
            // console.log(jb.fields[key].name);
            // console.log(jb.fields[key].description);
            // console.log(jb.fields[key].strokecolor);
            var features = [];
            let featuresIndex = 0;
            jb.fields[key].points.forEach((pts) => {
                let subfeature = []
                for (let index = 0; index + 2 < pts.length; index += 2) {
                    subfeature.push([pts[index], pts[index + 1]]);
                }
                subfeature.push(subfeature[0])

                if (subfeature.length >= 8) {
                    features[featuresIndex++] = subfeature
                }
            });

            if (typeof features[0] != 'undefined' && features.length >= 1) {
                var area = 0;
                features.forEach(sf => {
                    var p = turf.polygon([sf]);

                    // var options = {tolerance: 0.01, highQuality: false}
                    // var sp = turf.simplify(p, options)
                    // console.log(p.geometry.coordinates[0].length)
                    try {
                        // var pi = turf.intersect(p, syriaPolygon)
                    } catch (err) {
                        console.log(err)
                    }

                    var a = turf.area(p);
                    area += a;
                });

            }
            results.push({
                name: jb.fields[key].name,
                description: jb.fields[key].description,
                areaOriginal: area,
                area: Math.abs(Math.round(area / 1000))
            })
            totalArea += Math.abs(Math.round(area / 1000))
        }

        // results.forEach(element => {
        //     element.percent = Math.round(element.area * 100 / totalArea);
        //     console.log(`${element.name} : ${element.area} km : ${element.percent}`)
        // });
        // console.log(totalArea)
        results.forEach(element => {
            element.percent = Math.round(element.area * 10000 / totalArea) / 100;
        });
        callback({
            totalArea: totalArea,
            results: results,
            date: rdate.getTime()
        });

    });
};

var cdate = new Date(2015, 10, 30);
var cdate = new Date(1478473200000);
var cdate = new Date(1445814000000);


var partiesInvolved = ['date', 'asad', 'kurds', 'isis_syria', 'turkeysyria', 'syrian_rebels', 'others'];
var dataArray = [];
var weeks = 0

var printData = () => {
    console.log(cdate)
    console.log(partiesInvolved.join(';'));

    dataArray.forEach(data => {
        let csvLine = new Array(partiesInvolved.length).fill(0)
        data.results.forEach(element => {
            if (true == partiesInvolved.includes(element.name.toLowerCase())) {
                csvLine[partiesInvolved.indexOf(element.name.toLowerCase())] += element.percent
            } else if (element.name.toLowerCase().indexOf("kurds") > -1) {
                csvLine[partiesInvolved.indexOf('kurds')] += element.percent
            } else {
                csvLine[partiesInvolved.indexOf('others')] += element.percent
            }
        })
        csvLine[partiesInvolved.indexOf('date')] = data.date
        console.log(csvLine.join(';'))
    });

};

var processResults = (data) => {
    data.results.forEach(element => {
        console.log(`${element.name} : ${element.area} km : ${element.percent}`)
        if (false == partiesInvolved.includes(element.name.toLowerCase())) {
            //partiesInvolved.push(element.name.toLowerCase())
        }
    });
    dataArray.push(data);



    // console.log(data.totalArea)
    weeks++;
    cdate.setDate(cdate.getDate() + 7)
    if (cdate.getTime() <= Date.now()) {
        getRelativeAreas(cdate, processResults);
    } else {
        printData();
    }

};



getRelativeAreas(cdate, processResults);
// console.log(new Date(2015, 10, 30).getTime());
// console.log(new Date(1446159600).getDay());