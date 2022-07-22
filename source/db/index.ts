import { db } from "./postgres";
import { Couchbase } from "./couchbase";

export const couchbase = new Couchbase();
couchbase.initialize();

export default db
