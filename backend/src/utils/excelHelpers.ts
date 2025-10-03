// src/utils/excelHelpers.ts
export const headerMapping: Record<string, string> = {
    "วันที่ออก": "issueDate", "วันที่": "issueDate", "วันที่ออกใบสั่ง": "issueDate", "issueDate": "issueDate", "日期": "issueDate", "出单日期": "issueDate",
    "เลขที่ใบสั่งงาน": "workOrderNumber", "เลขที่": "workOrderNumber", "workOrderNumber": "workOrderNumber", "订单号": "workOrderNumber", "工单号": "workOrderNumber",
    "สินค้า": "product", "product": "product", "产品": "product", "货物": "product",
    "ชื่อคนขับ": "driverName", "คนขับ": "driverName", "driverName": "driverName", "司机": "driverName", "驾驶员": "driverName",
    "เบอร์โทร": "driverPhone", "เบอร์โทรพนักงาน": "driverPhone", "driverPhone": "driverPhone", "电话": "driverPhone", "联系电话": "driverPhone",
    "ทะเบียนหัว": "headPlate", "headPlate": "headPlate", "车头牌照": "headPlate",
    "ทะเบียนหาง": "tailPlate", "tailPlate": "tailPlate", "车尾牌照": "tailPlate",
    "เลขตู้": "containerNumber", "หมายเลขตู้": "containerNumber", "containerNumber": "containerNumber", "集装箱号": "containerNumber",
    "บริษัท": "companyName", "เลือกบริษัท": "companyName", "companyName": "companyName", "公司": "companyName", "企业": "companyName",
    "รายละเอียด": "description", "description": "description", "备注": "description", "说明": "description",
};

// Excel Date → JS Date
export function excelDateToJSDate(excelDate: any) {
    if (!excelDate) return null;
    if (typeof excelDate === "number") {
        const utc_days = Math.floor(excelDate - 25569);
        const utc_value = utc_days * 86400;
        return new Date(utc_value * 1000);
    } else if (typeof excelDate === "string") {
        const parsed = new Date(excelDate);
        return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
}
