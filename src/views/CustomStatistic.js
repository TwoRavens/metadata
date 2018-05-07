import m from 'mithril';

import Table from '../common/views/Table';
import * as app from "../app";
import TextField from "../common/views/TextField";

let allFields = ['name', 'value', 'description', 'replication', 'variables', 'image'];

let customCellValue = (id, field, value) => {
    if (Array.isArray(value)) value = value.join(', ');
    if (app.version) return value;

    if (['name', 'value', 'description', 'replication', 'variables'].indexOf(field) !== -1) {
        return m(TextField, {
            id: 'textFieldCustom' + field + id,
            value: value,
            onblur: (value) => app.setFieldCustom(id, field, value),
            style: {margin: 0}
        })
    }

    if (field === 'image') return [
        m('div.hide-mobile', {style: {display: 'inline-block'}}, [
            m('input', {type: 'file', onchange: (e) => app.setImageCustom(id, e)})
        ]),
        m('div', {style: {display: 'inline-block'}}, app.uploadStatus)]
};

export default class CustomStatistic {

    view(vnode) {
        let {id, name} = vnode.attrs;

        let colgroupAttributes = () => m('colgroup',
            m('col', {width: '20%'}),
            m('col', {width: '80%'}));

        return [
            // m('h5#customFieldHeader' + id, {style: {'padding-top': '.5em'}}, name),
            m(Table, {
                id: 'customFieldTable' + id,
                headers: [vnode.attrs['name'], ''],
                data: allFields.map(field => [field, customCellValue(id, field, vnode.attrs[field])]),
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