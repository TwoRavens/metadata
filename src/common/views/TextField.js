import m from 'mithril'
import {mergeAttributes} from "../common";

// ```
// m(TextField, {
//     id: string,
//     cancellable: Bool NOT IMPLEMENTED
//     oninput: called with value of field
//     *: any attribute may be passed
//     })
// ```

// Can pass attributes directly, for example 'placeholder' or 'oninput'

export default class TextField {
    view(vnode) {
        console.log(vnode.attrs);
        return m(`input.form-control`, mergeAttributes({
                style: {'margin': '5px 0', 'width': '100%'}
            },
            vnode.attrs,
            {
                oninput: m.withAttr('value', (vnode.attrs.oninput || Function)),
                onblur: m.withAttr('value', (vnode.attrs.onblur || Function))
            })
        );
    }
}
