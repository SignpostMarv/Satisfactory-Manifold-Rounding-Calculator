const fs = require('fs');

exports.automate_listed = (cb) => {
    const datasource = Object.entries(require(
        './third-party/satisfactory-tools/data/data.json'
    ).recipes).filter((entry) => {
        const [_id, value] = entry;

        return (
            Object.keys(value).includes('producedIn')
            && value.producedIn instanceof Array
            && 1 === value.producedIn.length
        );
    });

    const data = {
        raw_resources: [
        ],
        ingots: [
        ],
        constructables: [
        ],
        assemblerables: [
        ],
        manufacturerables: [
        ],
        refineables: [
        ]
    };

    datasource.forEach((entry) => {
        const [id, value] = entry;

        let target = [];

        if (value.producedIn.includes('Desc_AssemblerMk1_C')) {
            target = data.assemblerables;
        } else if (value.producedIn.includes('Desc_ManufacturerMk1_C')) {
            target = data.manufacturerables;
        } else if (value.producedIn.includes('Desc_ConstructorMk1_C')) {
            target = data.constructables;
        } else if (value.producedIn.includes('Desc_OilRefinery_C')) {
            target = data.refineables;
        } else if (
            value.producedIn.includes('Desc_FoundryMk1_C')
            || value.producedIn.includes('Desc_SmelterMk1_C')
        ) {
            target = data.ingots;
        }

        target.push(id);
    });

    fs.writeFileSync(
        './src/data.json',
        JSON.stringify(
            Object.fromEntries(Object.entries(data).map((entry) => {
                const [id, values] = entry;

                values.sort();

                return [id, values];
            })),
            null,
            '\t'
        )
    );

    cb();
};

exports.unlisted = (cb) => {
    const listed = Object.values(require('./src/data.json')).reduce(
        (prev, current) => {
            current.forEach((id) => {
                if ( ! prev.includes(id)) {
                    prev.push(id);
                }
            });

            return prev;
        },
        []
    );
    const excluded = require('./src/excluded.json');

    const datasource = Object.keys((require(
        './third-party/satisfactory-tools/data/data.json'
    )).recipes);

    const unlisted = datasource.filter((id) => {
        return ! listed.includes(id) && ! excluded.includes(id);
    });

    console.log(`${unlisted.length} items unlisted:\n ${unlisted.join('\n')}`);

    cb();
};
