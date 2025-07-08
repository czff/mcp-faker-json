export interface YAPIData {
  query_path: Querypath;
  edit_uid: number;
  status: string;
  type: string;
  req_body_is_json_schema: boolean;
  res_body_is_json_schema: boolean;
  api_opened: boolean;
  index: number;
  tag: any[];
  _id: number;
  req_body_type: string;
  res_body_type: string;
  req_body_other: string;
  title: string;
  path: string;
  catid: number;
  markdown: string;
  req_headers: Reqheader[];
  req_query: any[];
  res_body: string;
  method: string;
  req_body_form: any[];
  desc: string;
  project_id: number;
  req_params: any[];
  uid: number;
  add_time: number;
  up_time: number;
  __v: number;
  username: string;
}

export interface Reqheader {
  required: string;
  _id: string;
  name: string;
  value: string;
  example: string;
}

export interface Querypath {
  path: string;
  params: any[];
}

export interface YAPIRes {
  errcode: number;
  errmsg: string;
  data: YAPIData;
}
