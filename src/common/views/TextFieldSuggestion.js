import m from 'mithril'
import {mergeAttributes} from "../common";
import levenshtein from 'js-levenshtein'

// ```
// m(TextField, {
//     id: string,
//     suggestions: ['possibility 1', 'possibility 2'],
//     enforce: boolean,
//     oninput: called with value of field
//     *: any attribute may be passed
//     })
// ```

// suggestions are shown below the text box.
// if enforce is true, then the value must be one of the suggestions
// Can pass attributes directly, for example 'placeholder' or 'oninput'


let distanceSort = (array, value) => array
    .map(item => [item, levenshtein(item, value)])
    .sort((a, b) => a[1] - b[1])
    .map(item => item[0]);

export default class TextFieldSuggestion {
    oninit(vnode) {
        this.value = vnode.attrs.defaultValue || '';
        this.isDropped = false;
    }

    view(vnode) {
        let {id, suggestions, enforce, limit, dropWidth, attrsAll} = vnode.attrs;

        let setValue = (val) => this.value = val;
        let setIsDropped = (state) => this.isDropped = state;

        return m('div', [
            m(`input#${id}.form-control`, mergeAttributes({
                    value: this.value,
                    style: {'margin': '5px 0', 'width': '100%'},
                    onclick: function () {
                        setIsDropped(true);
                        vnode.attrs.onclick && m.withAttr('value', vnode.attrs.onclick);
                    },
                    oninput: function () {
                        setValue(this.value);
                        (vnode.attrs.oninput || Function)(this.value)
                    },
                    onblur: function() {
                        setTimeout(() => setIsDropped(false), 100);
                        if (enforce) setValue(distanceSort(suggestions, this.value)[0]);
                        (vnode.attrs.onblur || Function)(this.value);
                    }
                }, attrsAll)
            ),
            m('ul.dropdown-menu', {
                    'aria-labelledby': id,
                    style: {
                        top: 'auto',
                        left: 'auto',
                        width: dropWidth,
                        'min-width': 0,
                        display: this.isDropped ? 'block' : 'none'
                    }
                },
                distanceSort(suggestions, this.value).slice(0, limit).map((item) =>
                    m('li.dropdown-item', {
                        value: item,
                        onclick: () => {
                            setValue(item);
                            (vnode.attrs.oninput || Function)(item);
                        },
                        style: {'padding-left': '10px', 'z-index': 200}
                    }, item))
            )
        ]);
    }
}
