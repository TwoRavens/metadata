import m from 'mithril';
import Table from "../common/views/Table";
import * as app from "../app";

export default class Citation {
    view() {
        let colgroupCitation = () => m('colgroup',
            m('col', {width: '20%'}),
            m('col', {width: '80%'}));

        return [
            m('h5#citationHeader', {style: {'padding-top': '.5em', 'text-align': 'center'}}, 'Citation'),
            m(Table, {
                id: 'citationTable',
                data: Object.keys(app.citation)
                    .filter(key => typeof(app.citation[key]) === "string")
                    .reduce((obj, key) => {obj[key] = app.citation[key]; return obj;}, {}),
                attrsCells: {style: {padding: '.5em'}},
                tableTags: colgroupCitation()
            }),
            app.citation['author'] && [
                m('h5#citationAuthorsHeader', {style: {'padding-top': '.5em', 'text-align': 'center'}}, 'Authors'),
                m(Table, {
                    id: 'citationAuthorsTable',
                    headers: ['name', 'affiliation'],
                    data: app.citation['author'],
                    attrsCells: {style: {padding: '.5em'}},
                    tableTags: colgroupCitation()
                })
            ],
            app.citation['keywords'] && [
                m('h5#citationKeywordsHeader', {style: {'padding-top': '.5em', 'text-align': 'center'}}, 'Keywords'),
                m(Table, {
                    id: 'citationkeywordsTable',
                    headers: ['id', 'value'],
                    data: app.citation['keywords'].map((key, i) => [i + 1, app.citation['keywords'][i]]),
                    attrsCells: {style: {padding: '.5em'}},
                    tableTags: colgroupCitation()
                })
            ],
            // citations for citations?
            app.citation['citation'] && [
                m('h5#citationCitationHeader', {style: {'padding-top': '.5em', 'text-align': 'center'}}, 'Citations'),
                m(Table, {
                    id: 'citationCitationTable',
                    data: app.citation['citation'].map((key, i) => [i + 1, app.citation['citation'][i]]),
                    attrsCells: {style: {padding: '.5em'}},
                    tableTags: colgroupCitation()
                })
            ],
            app.citation['license'] && [
                m('h5#citationLicenseHeader', {style: {'padding-top': '.5em', 'text-align': 'center'}}, 'License'),
                m(Table, {
                    id: 'citationLicenseTable',
                    headers: ['name', 'value'],
                    data: app.citation['license'],
                    attrsCells: {style: {padding: '.5em'}},
                    tableTags: colgroupCitation()
                }),
            ],
            app.citation['includedInDataCatalog'] && [
                m('h5#citationCatalogHeader', {style: {'padding-top': '.5em', 'text-align': 'center'}}, 'Catalog'),
                m(Table, {
                    id: 'citationCatalogTable',
                    data: app.citation['includedInDataCatalog'],
                    attrsCells: {style: {padding: '.5em'}},
                    tableTags: colgroupCitation()
                }),
            ],
            app.citation['provider'] && [
                m('h5#citationProviderHeader', {style: {'padding-top': '.5em', 'text-align': 'center'}}, 'Provider'),
                m(Table, {
                    id: 'citationProviderTable',
                    data: app.citation['provider'],
                    attrsCells: {style: {padding: '.5em'}},
                    tableTags: colgroupCitation()
                })
            ]
        ]
    }
}