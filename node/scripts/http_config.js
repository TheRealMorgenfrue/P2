'use strict'

// These headers might not be needed, since the server settings appears to overwrite them, but are included anyway for now

let header = new Headers();
header.set("Cache-Control", "no-store", "no-cache", "must-revalidate", "proxy-revalidate");
header.set("Pragma", "no-cache");
header.set("Expires", "0");
header.set("Surrogate-Control", "no-store");