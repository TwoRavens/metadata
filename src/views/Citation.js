import m from 'mithril';
import Table from "../common/views/Table";

export default class Citation {
    view(vnode) {
        let {citation} = vnode.attrs;
        if (!citation) return undefined;

        let colgroupCitation = () => m('colgroup',
            m('col', {width: '20%'}),
            m('col', {width: '80%'}));

        return [
            m('h5#citationHeader', {style: {'padding-top': '.5em', 'text-align': 'center'}}, 'Citation'),
            m(Table, {
                id: 'citationTable',
                data: Object.keys(citation)
                    .filter(key => typeof(citation[key]) === "string")
                    .reduce((obj, key) => {obj[key] = citation[key]; return obj;}, {}),
                attrsCells: {style: {padding: '.5em'}},
                tableTags: colgroupCitation()
            }),
            citation['author'] && [
                m('h5#citationAuthorsHeader', {style: {'padding-top': '.5em', 'text-align': 'center'}}, 'Authors'),
                m(Table, {
                    id: 'citationAuthorsTable',
                    data: citation['author'],
                    attrsCells: {style: {padding: '.5em'}},
                    tableTags: colgroupCitation()
                })
            ],
            citation['keywords'] && [
                m('h5#citationKeywordsHeader', {style: {'padding-top': '.5em', 'text-align': 'center'}}, 'Keywords'),
                m(Table, {
                    id: 'citationkeywordsTable',
                    headers: ['id', 'value'],
                    data: citation['keywords'].map((key, i) => [i + 1, citation['keywords'][i]]),
                    attrsCells: {style: {padding: '.5em'}},
                    tableTags: colgroupCitation()
                })
            ],
            // citations for citations?
            citation['citation'] && [
                m('h5#citationCitationHeader', {style: {'padding-top': '.5em', 'text-align': 'center'}}, 'Citations'),
                m(Table, {
                    id: 'citationCitationTable',
                    data: citation['citation'].map((key, i) => [i + 1, citation['citation'][i]]),
                    attrsCells: {style: {padding: '.5em'}},
                    tableTags: colgroupCitation()
                })
            ],
            citation['license'] && [
                m('h5#citationLicenseHeader', {style: {'padding-top': '.5em', 'text-align': 'center'}}, 'License'),
                m(Table, {
                    id: 'citationLicenseTable',
                    data: citation['license'],
                    attrsCells: {style: {padding: '.5em'}},
                    tableTags: colgroupCitation()
                }),
            ],
            citation['includedInDataCatalog'] && [
                m('h5#citationCatalogHeader', {style: {'padding-top': '.5em', 'text-align': 'center'}}, 'Catalog'),
                m(Table, {
                    id: 'citationCatalogTable',
                    data: citation['includedInDataCatalog'],
                    attrsCells: {style: {padding: '.5em'}},
                    tableTags: colgroupCitation()
                }),
            ],
            citation['provider'] && [
                m('h5#citationProviderHeader', {style: {'padding-top': '.5em', 'text-align': 'center'}}, 'Provider'),
                m(Table, {
                    id: 'citationProviderTable',
                    data: citation['provider'],
                    attrsCells: {style: {padding: '.5em'}},
                    tableTags: colgroupCitation()
                })
            ]
        ]
    }
}