import m from 'mithril'

import Table from "../common/views/Table";
import TextField from "../common/views/TextField";
import TwoPanel from "../common/views/TwoPanel";

import * as app from "../app";
import Citation from "./Citation";
import CustomStatistic from "./CustomStatistic";

export default class MenuDataset {

    datasetTable() {
        return [
            [
                'new preprocess', [
                m('label.btn.btn-outline-secondary.hide-mobile', {style: {display: 'inline-block'}}, [
                    m('input', {
                        hidden: true,
                        type: 'file',
                        onchange: app.uploadFile
                    })
                ], 'Browse'),
                m('div', {style: {display: 'inline-block'}}, app.uploadStatus)]
            ], [
                'preprocess ID', m(TextField, {
                    style: {display: 'inline', width: 'auto'},
                    id: 'textFieldPreprocessID',
                    value: app.preprocessId,
                    placeholder: 'numeric',
                    oninput: async (id) => {
                        let tempId = app.preprocessId;
                        // change route if loaded successfully
                        if (await app.getData(id)) m.route.set('/' + app.preprocessId + '/' + app.metadataMode);
                        // otherwise attempt to fall back
                        else if (id !== '') {
                            alert('ID ' + id + ' was not found.');
                            // noinspection JSIgnoredPromiseFromCall
                            app.getData(tempId);
                        }
                        else {
                            app.preprocessId = undefined;
                            m.route.set('/undefined/editor');
                        }
                    }
                })
            ], [
                'version', [
                    m(TextField, {
                        style: {display: 'inline', width: 'auto'},
                        id: 'textFieldVersionID',
                        value: app.self['version'] || '',
                        disabled: app.self['version'] === undefined,
                        onblur: async (version) => {
                            // change route if loaded successfully
                            if (await app.getData(app.preprocessId, version)) m.route.set('/' + app.preprocessId + '/' + app.metadataMode);
                            // otherwise attempt to fall back
                            else if (version !== '') {
                                alert('Version ' + version + ' was not found.');
                                // noinspection JSIgnoredPromiseFromCall
                                app.getData(app.preprocessId);
                            }
                        }
                    }),
                    // pops up when a custom version is set
                    app.version && [
                        m('div', {
                            style: {
                                display: 'inline-block',
                                "margin-left": '2em'
                            }
                        }, 'Menu is readonly.'),
                        m("button#btnCurrent.btn.btn-outline-secondary", {
                                title: 'Return to latest version of preprocess ID ' + app.preprocessId,
                                style: {"margin-left": '2em'},
                                onclick: () => app.getData(app.preprocessId)
                            },
                            'Reload'
                        ),
                    ]
                ]
            ],
        ]
    }

    view() {
        let colgroupDataset = () => m('colgroup',
            m('col', {width: '20%'}),
            m('col', {width: '80%'}));

        // Sets spacing of variable table column
        return m('div#editor', {
            style: {
                height: '100%',
                width: '100%',
                position: 'absolute',
                'overflow': 'hidden'
            }
        }, m(TwoPanel, {
            left: [
                m('h4#selectDatasetHeader', {
                    style: {
                        'padding-top': '.5em',
                        'text-align': 'center'
                    }
                }, 'Select Dataset'),
                m(Table, {
                    id: 'datasetTable',
                    data: this.datasetTable(),
                    attrsCells: {style: {padding: '.5em'}},
                    tableTags: colgroupDataset()
                }),
                app.preprocessId && [
                    m('h4#datasetHeader', {
                        style: {
                            'padding-top': '.5em',
                            'text-align': 'center'
                        }
                    }, 'Dataset Statistics'),
                    m(Table, {
                        id: 'datasetStatistics',
                        headers: ['name', 'value'],
                        data: Object.assign({}, app.dataset,
                            !app.version && {
                                'name': m(TextField, {
                                    id: 'textFieldDatasetName',
                                    value: app.dataset['name'],
                                    // TODO edit dataset attributes
                                    onblur: (value) => console.log(value),
                                    style: {margin: 0}
                                }),
                                'description': m(TextField, {
                                    id: 'textFieldDatasetDescription',
                                    value: app.dataset['description'],
                                    onblur: (value) => console.log(value),
                                    style: {margin: 0}
                                })
                            }),
                        attrsCells: {style: {padding: '.5em'}},
                        tableTags: colgroupDataset()
                    }),
                    m(Citation, {citation: app.citation})
                ]
            ],
            right: app.preprocessId && [
                m('h4#datasetFieldHeader', {style: {'padding-top': '.5em', 'text-align': 'center'}}, "Custom Statistics"),
                Object.keys(app.customStatistics).concat(app.version ? [] : ['ID_NEW'])
                    .map((id) => m(CustomStatistic, {id})
                )
            ]
        }));
    }
}