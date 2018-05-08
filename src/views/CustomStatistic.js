import m from 'mithril';

import Table from '../common/views/Table';
import TextField from "../common/views/TextField";
import TextFieldSuggestion from "../common/views/TextFieldSuggestion";
import ListTags from "../common/views/ListTags";

import * as app from "../app";

let allFields = ['name', 'value', 'description', 'replication', 'variables', 'image'];

let customCellValue = (id, field, value) => {
    if (app.version) return value;

    if (['name', 'value'].indexOf(field) !== -1) {
        return m(TextField, {
            class: !value && ['is-invalid'],
            id: 'textFieldCustom' + field + id,
            value: value,
            onblur: (value) => app.setFieldCustom(id, field, value),
            style: {margin: 0}
        })
    }

    if (['description', 'replication'].indexOf(field) !== -1) {
        return m(TextField, {
            id: 'textFieldCustom' + field + id,
            value: value,
            onblur: (value) => app.setFieldCustom(id, field, value),
            style: {
                width: '100%',
                'box-sizing': 'border-box',
                margin: 0
            }
        })
    }

    if (field === 'variables') {
        return [
            m(TextFieldSuggestion, {
                id: 'textFieldCustom' + field + id,
                enforce: true,
                limit: 5,
                value: app.queuedCustomVariable[id],
                suggestions: Object.keys(app.variables),
                oninput: (value) => app.queuedCustomVariable[id] = value,
                onblur: (value) => app.queuedCustomVariable[id] = value,
                attrsAll: {style: {display: 'inline', width: 'auto', margin: 0}}
            }),
            app.queuedCustomVariable[id] && m(`button#btnVarAdd${id}.btn.btn-outline-secondary`, {
                    disabled: !app.queuedCustomVariable[id],
                    title: 'record that variable is related to this statistic',
                    style: {display: 'inline-block', "margin-left": '2em'},
                    onclick: () => {
                        // ignore if already added
                        if (app.custom_statistics[id]['variables'].indexOf(app.queuedCustomVariable[id]) !== -1) return;

                        // noinspection JSIgnoredPromiseFromCall
                        app.setFieldCustom(id, field, [
                            ...app.custom_statistics[id]['variables'],
                            app.queuedCustomVariable[id]
                        ]);
                        app.queuedCustomVariable[id] = '';
                    }
                },
                'Add'
            ),
            m(ListTags, {tags: value || []})
        ];
    }

    if (field === 'image') return [
        m('div.hide-mobile', {style: {display: 'inline-block'}}, [
            m('input', {type: 'file', onchange: (e) => app.setImageCustom(id, e)})
        ]),
        m('div', {style: {display: 'inline-block'}}, app.uploadStatus)]
};

export default class CustomStatistic {

    view(vnode) {
        let {id} = vnode.attrs;

        console.log("CUSTOM STATISTICS:");
        console.log(app.custom_statistics);
        console.log(id);


        let colgroupAttributes = () => m('colgroup',
            m('col', {width: '20%'}),
            m('col', {width: '80%'}));

        return [
            // m('h5#customFieldHeader' + id, {style: {'padding-top': '.5em'}}, name),
            m(Table, {
                id: 'customFieldTable' + id,
                headers: [app.custom_statistics[id]['name'] || 'New Statistic', ''],
                data: allFields.map(field => [field, customCellValue(id, field, app.custom_statistics[id][field])]),
                tableTags: colgroupAttributes(),
                attrsCells: {style: {padding: '.3em'}},
                attrsAll: {
                    style: {
                        width: 'calc(100% - 2em)',
                        'margin-left': '1em',
                        'border-left': '1px solid #dee2e6',
                        'box-shadow': '0 3px 3px #777',
                        animation: 'slide-down .4s ease'
                    }
                }
            })
        ]
    }
}