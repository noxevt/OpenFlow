import { Node } from "node-red";
import { libmailserver } from "./libmailserver";
import { NoderedUtil } from "./NoderedUtil";

module.exports = function (RED) {
    "use strict";

    RED.nodes.registerType("smtpserver in", function (n) {
        RED.nodes.createNode(this, n);
        this.name = n.name;
        this.email = n.email;
        this.port = n.port;
        var node = this;
        var mailserver: libmailserver;

        const onEmail = (email) => {
            try {
                var sendit: boolean = false;
                if (node.email == null || node.email == '' || node.email == '*') {
                    sendit = true;
                }
                if (email.to) {
                    if (email.to.value.filter(addr => addr.address == node.email).length > 0) {
                        sendit = true;
                    }
                }
                if (email.bcc) {
                    if (email.bcc.value.filter(addr => addr.address == node.email).length > 0) {
                        sendit = true;
                    }
                }
                if (sendit) {
                    var msg = { payload: email, instanceid: null };
                    var instanceid = email.headers.get('instanceid');
                    if (!instanceid) {
                        instanceid = email.headers.get('XREF');
                    }
                    if (!instanceid) {
                        var startindex = email.text.indexOf('instanceid');
                        //var endindex = email.text.indexOf('instanceid', startindex+10) + 10;
                        //var text = email.text.substring(startindex, endindex - startindex);
                        var text = email.text.substring(startindex);
                        var arr = text.split(':');
                        instanceid = arr[1];
                    }

                    msg.instanceid = instanceid;
                    node.send(msg);
                    // } else {
                    //     config.log(1, email);
                }
            } catch (error) {
                NoderedUtil.HandleError(this, error);
            }
        }
        async function init(port: number) {
            try {
                mailserver = await libmailserver.setupSMTP(port);
                mailserver.on('email', onEmail);
                //mailserver.on('email', onEmail);
                //libmailserver.current.on('email', onEmail);
            } catch (error) {
                NoderedUtil.HandleError(this, error);
            }
        }

        var port = node.port;
        // if(port && port !='') {
        //     port = parseInt(node.port);
        // } else {
        //     port = config.mailserver_port;
        // }
        // port = config.mailserver_port;
        port = 25;
        init(port);

        this.on("close", function () {
            //mailserver.removeAllListeners(node.endpointname);
            mailserver.removeListener('email', onEmail);
        });

    });

}
