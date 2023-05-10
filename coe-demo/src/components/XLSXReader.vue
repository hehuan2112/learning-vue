<script setup>
import { ref } from 'vue'
import { fs_open_files, fs_read_data } from "../utils/file_system_access.js"
import * as XLSX from "xlsx/xlsx.mjs"

// the file name for the uploaded file
const file_name = ref(null);
const file_info = ref(null);
const file_data = ref([]);

async function on_drop_file(e) {
    e.stopPropagation();
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    console.log("* got file", f);

    /* f is a File */
    file_name.value = '[' + f.name + ']';
    file_info.value = 'Reading File';

    const wb = await fs_read_data(f);
    console.log('* got wb', wb);
    const wsn = wb.SheetNames[0];
    console.log('* got SheetNames', wsn);
    const ws = wb.Sheets[wsn];
    console.log('* got Sheets', ws);
    const js = XLSX.utils.sheet_to_json(ws);
    console.log('* got JSON', js);
    // update some info
    file_info.value = 'Load ' + js.length + ' Records';

    // finally, set the data
    file_data.value = js;
}

function on_dragover_prevent_default(event) {
    event.preventDefault();
}

function on_click_open_file(event) {
    var pickerOpts = {
        types: [
            {
                description: 'Data File',
                accept: {
                    'text/dtd': ['.xlsx']
                }
            },
        ],
        excludeAcceptAllOption: true,
        multiple: false
    };

    // get the file handles
    var promise_fileHandles = fs_open_files(pickerOpts);

}

async function on_click_load_sample_data(event) {
    // this is the sample file
    file_name.value = 'pwma_sample.xlsx'
    // const url = "./src/assets/" + file_name.value;
    const url = "./" + file_name.value;
    // const url = sample_url;

    // get data
    const data = await (await fetch(url)).arrayBuffer();
    /* data is an ArrayBuffer */
    const wb = XLSX.read(data);
    const wsn = wb.SheetNames[0];
    console.log('* got SheetNames', wsn);
    const ws = wb.Sheets[wsn];
    console.log('* got Sheets', ws);
    const js = XLSX.utils.sheet_to_json(ws);

    file_info.value = 'Load ' + js.length + ' Records';
    file_data.value = js;
}

///////////////////////////////////////////////////////////
// Expose functions
///////////////////////////////////////////////////////////
function get_rs() {
    return JSON.parse(JSON.stringify(file_data.value));
}

// expose some functions
defineExpose({
    get_rs
})
</script>

<template>
<div class="xlsx-reader-box">

    <p>
        You can try our sample dataset:
    </p>
    <div style="padding: 5px 0;">
        <button @click="on_click_load_sample_data">
            <i class="fas fa-cloud-upload-alt"></i>
            Load Sample
        </button>

        <a target='_blank' 
            href="./pwma_sample.xlsx" 
            style="padding: 0 5px;">
            <i class="fa fa-download"></i>
            Download Sample
        </a>
    </div>

    <p>
        Or use your own dataset:
    </p>

    <div class="xlsx-reader" v-on:click="on_click_open_file" v-on:dragover="on_dragover_prevent_default"
        v-on:drop="on_drop_file">
        <p id="xlsx-reader-info">
            <span v-if="file_name === null">
                Drop <b>.xlsx</b> File Here
            </span>
            <span v-else>
                {{ file_name }} <br>
                {{ file_info }}
            </span>
        </p>
    </div>
    <div v-if="file_data.length>0" class="xlsx-info">
        <dl>
            <dt>Columns:</dt>
            <dd>{{ Object.keys(file_data[0]).join(', ') }}</dd>

            <dt>Records:</dt>
            <dd>{{ file_data.length }}</dd>
        </dl>
    </div>
</div>
</template>

<style scoped>
.xlsx-reader-box {
    width: 100%;
    height: auto;
    display: flex;
    align-items: flex-start;
    flex-direction: column;
}
.xlsx-reader {
    width: 100%;
    height: 100px;
    border: 1px dotted #777777;
    display: flex;
    align-items: center;
    justify-content: center;
}
.xlsx-info {
    width: 100%;
    text-align: left;
    font-size: 0.9em;
}
</style>
