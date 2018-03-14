import m from 'mithril';

import {selVarColor, mergeAttributes} from "../common";

// Interface specification
//
// ```
// m(Table, {
//     id: id (String),
//     headers: ['col1Header', 'col2Header'],
//     data: [['row1col1', 'row1col2'], ['row2col1', 'row2col2']] or function
//     activeRow: 'row1col1', (optional)
//     onclick: (uid, colID) => console.log(uid + " row was clicked, column number " + colID + " was clicked"), (optional)
//     showUID: true | false, (optional)
//
//     attrsAll: { apply attributes to all divs },(optional)
//     attrsRows: { apply attributes to each row }, (optional)
//     attrsCells: { apply attributes to each cell } (optional)
//     tableTags: [ m('colgroup', ...), m('caption', ...), m('tfoot', ...)]
//     })
// ```

// The UID for the table is the key for identifying a certain row.
// The UID is the first column, and its value is passed in the onclick callback.
// The first column may be hidden via showUID: false. This does not remove the first header

// Table tags allows passing colgroups, captions, etc. into the table manually. Can be a single element or list

export default class Table {
    view(vnode) {
        let {id, data, headers, activeRow, onclick, showUID} = vnode.attrs;
        // Interface custom attributes
        let {attrsAll, attrsRows, attrsCells, tableTags} = vnode.attrs;

        showUID = showUID !== false; // Default is 'true'
        if (typeof data === 'function') data = data();

        return m(`table.table#${id}`, mergeAttributes({style: {width: '100%'}}, attrsAll), [
            tableTags,
            headers ? m('tr', {style: {width: '100%'}}, [
                ...headers.map((header) => m('th', header))
            ]) : undefined,

            ...data.map((row) => m('tr', mergeAttributes(row[0] === activeRow ? {
                    style: {'background': selVarColor},
                } : {}, attrsRows),
                row.filter((item, i) => i !== 0 || showUID).map((item, i) => m('td',
                    mergeAttributes(onclick ? {onclick: () => onclick(row[0], i)} : {}, attrsCells), item))
                )
            )]
        );
    };
}
