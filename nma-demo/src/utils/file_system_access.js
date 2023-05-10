import { readFile } from "xlsx"

export async function fs_open_files(pickerOpts) {
    const fhs = await window.showOpenFilePicker(pickerOpts);
    return fhs;
}

export async function fs_read_data(fh) {
    const data = await fh.arrayBuffer();
    /* data is an ArrayBuffer */
    const workbook = readFile(data);
    return workbook;
}