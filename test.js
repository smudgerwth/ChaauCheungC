const fs = require('fs');
const csv = require('csv-parser');

function readCSVFile(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
}

async function getVenueList(filePath) {
    const venueArray = await readCSVFile(filePath);
    return Object.values(venueArray.reduce((acc, obj) => {
        const key = obj.facilityType + obj.area;
        if (!acc[key]) {
            acc[key] = {
                facilityType: obj.facilityType,
                area: obj.area,
                list: []
            };
        }
        if (obj.select === 'Y') {
            acc[key].list.push({
                venue: obj.venue,
                name: obj.name,
            });
        }
        return acc;
    }, {}));
}

(async () => {
    try {
        let groupedArray = await getVenueList('venues.csv');
        
        groupedArray.forEach(group => {
            console.log(`Facility Type: ${group.facilityType}, Area: ${group.area}`);
            group.list.forEach(item => {
                console.log(`Venue: ${item.venue}, Name: ${item.name}`);
            });
            console.log('-----------------------');
        });
        
    } catch (error) {
        console.error(error);
    }
})();
