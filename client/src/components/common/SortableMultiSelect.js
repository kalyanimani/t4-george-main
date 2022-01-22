import React, { useEffect } from 'react';

import Select, {
    components,
} from 'react-select';
import {
    SortableContainer,
    SortableElement,
    SortableHandle,
} from 'react-sortable-hoc';

function arrayMove(array, from, to) {
    const slicedArray = array.slice();
    slicedArray.splice(
        to < 0 ? array.length + to : to,
        0,
        slicedArray.splice(from, 1)[0]
    );
    return slicedArray;
}

const SortableMultiValue = SortableElement(
    (props) => {
        // this prevents the menu from being opened/closed when the user clicks
        // on a value to begin dragging it. ideally, detecting a click (instead of
        // a drag) would still focus the control and toggle the menu, but that
        // requires some magic with refs that are out of scope for this example
        const onMouseDown = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };
        const innerProps = { ...props.innerProps, onMouseDown };
        return <components.MultiValue {...props} innerProps={innerProps} />;
    }
);

const SortableMultiValueLabel = SortableHandle(
    (props) => <components.MultiValueLabel {...props} />
);

const SortableSelect = SortableContainer(Select)


export default function SortableMultiSelect({ data, defaultSelectAll, onSelectedItemsChange }) {
    const [selected, setSelected] = React.useState(defaultSelectAll ? [...data] : []);

    useEffect(() => {
        onSelectedItemsChange(selected)
    }, [selected])

    const onChange = (selectedOptions) =>
        setSelected(selectedOptions);

    const onSortEnd = ({ oldIndex, newIndex }) => {
        const newValue = arrayMove(selected, oldIndex, newIndex);
        setSelected(newValue);
        console.log(
            'Values sorted:',
            newValue.map((i) => i.value)
        );
    };

    return (
        <SortableSelect
            useDragHandle
            // react-sortable-hoc props:
            axis="xy"
            onSortEnd={onSortEnd}
            distance={4}
            // small fix for https://github.com/clauderic/react-sortable-hoc/pull/352:
            getHelperDimensions={({ node }) => node.getBoundingClientRect()}
            // react-select props:
            isMulti
            options={data}
            value={selected}
            onChange={onChange}
            components={{
                // @ts-ignore We're failing to provide a required index prop to SortableElement
                MultiValue: SortableMultiValue,
                MultiValueLabel: SortableMultiValueLabel,
            }}
            closeMenuOnSelect={false}
        />
    );
}
