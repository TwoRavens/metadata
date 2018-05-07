import m from "mithril";
import {preprocess_id} from "./app";

// TODO: this will get merged back into app.js when ready. This needs to be completely re-done

export let statisticUIDCount = 0;
export let customStatistics = {};

export let selectedDatasetField;
export let setSelectedDatasetAttribute = (attr) => selectedDatasetField = attr;

export let setCustomStatistic = (variable, statUID, field, value) => {
    console.log(customStatistics);

    // create key for variable if it does not exist
    if (!customStatistics[variable]) {
        customStatistics[variable] = {};
        statisticUIDCount[variable] = 0;
    }

    // delete empty values/statistics
    if (value === '') {
        // ignore adding empty field to nonexistent statistic
        if (!customStatistics[variable][statUID]) return;

        // delete the field
        delete customStatistics[variable][statUID][field];

        // attempt to delete the statistic
        if (Object.keys(customStatistics[variable][statUID]).length === 0) {
            delete customStatistics[variable][statUID];
            usedCustomStatistics[variable].delete(parseInt(statUID));
        }

        return;
    }

    // create key for new statistic if UID does not exist
    if (statUID > statisticUIDCount[variable]) {
        customStatistics[variable][statUID] = customStatistics[variable][statUID] || {};

        // enable new custom statistics by default
        setUsedCustomStatistic(true, variable, statUID);
        statisticUIDCount[variable]++;
    }

    // set value in field in statistic in variable
    customStatistics[variable][statUID][field] = value;

    m.request({
        method: "POST",
        url: data_url + "form/custom-statistics",
        data: {
            preprocess_id: preprocess_id,
            custom_statistics: [
                Object.assign({"variables": [variable], "image": []}, customStatistics[variable][statUID])
            ]
        }
    }).then((response) => console.log(response));

    console.log(JSON.stringify({
        preprocess_id: preprocess_id,
        custom_statistics: [
            Object.assign({"variables": [variable], "image": []}, customStatistics[variable][statUID])
        ]
    }));
};

export let usedCustomStatistics = {};
export let setUsedCustomStatistic = (status, variable, UID) => {
    // create key for variable if it does not exist
    usedCustomStatistics[variable] = usedCustomStatistics[variable] || new Set();
    if (UID) {
        status ?
            usedCustomStatistics[variable].add(UID) :
            usedCustomStatistics[variable].delete(UID);
    } else {
        usedCustomStatistics[variable] = status ?
            new Set(Object.keys(customStatistics[variable] || [])) :
            new Set();
    }
};