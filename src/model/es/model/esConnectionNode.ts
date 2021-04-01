import { Util } from "@/common/util";
import { QueryGroup } from "@/model/query/queryGroup";
import { DbTreeDataProvider } from "@/provider/treeDataProvider";
import { QueryUnit } from "@/service/queryUnit";
import * as compareVersions from 'compare-versions';
import * as path from "path";
import { ExtensionContext, TreeItemCollapsibleState } from "vscode";
import { Constants, ModelType } from "../../../common/constants";
import { ConnectionManager } from "../../../service/connectionManager";
import { CommandKey, Node } from "../../interface/node";
import { EsIndexGroup } from "./esIndexGroupNode";
import { EsTemplate } from "./esTemplate";
const extPackage=require("@/../package.json")

/**
 * https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html
 */
export class EsConnectionNode extends Node {

    private static versionMap = {}
    public iconPath: string = path.join(Constants.RES_PATH, "icon/es.png");
    public contextValue: string = ModelType.ES_CONNECTION;
    constructor(readonly key: string, readonly parent: Node) {
        super(key)
        this.init(parent)
        if(compareVersions(extPackage.version,'3.6.6')===1){
            this.label = (this.usingSSH) ? `${this.ssh.host}@${this.ssh.port}` : `${this.host}`;
        }else{
            this.label = (this.usingSSH) ? `${this.ssh.host}@${this.ssh.port}` : `${this.host}@${this.port}`;
        }
        
        this.cacheSelf()
        const lcp = ConnectionManager.activeNode;

        if (this.disable) {
            this.collapsibleState = TreeItemCollapsibleState.None;
            this.iconPath = path.join(Constants.RES_PATH, "icon/close.svg");
            return;
        }

        if (this.isActive(lcp)) {
            this.iconPath = path.join(Constants.RES_PATH, "icon/connection-active.svg");
        }

        if (EsConnectionNode.versionMap[this.label]) {
            this.description = EsConnectionNode.versionMap[this.label]
        } else {
            this.execute<any>('get /').then(res => {
                this.description=`version: ${res.version.number}`
                EsConnectionNode.versionMap[this.label]=this.description
                DbTreeDataProvider.refresh(this)
            }).catch(err=>{
                console.log(err)
            })
        }

    }


    newQuery() {
        QueryUnit.showSQLTextDocument(this,EsTemplate.query,`${this.host}.es`)
    }

    async getChildren(): Promise<Node[]> {

        return [new EsIndexGroup(this),new QueryGroup(this)]

    }

    public copyName() {
        Util.copyToBoard(this.host)
    }

    public async deleteConnection(context: ExtensionContext) {

        Util.confirm(`Are you want to Delete Connection ${this.label} ? `, async () => {
            this.indent({command:CommandKey.delete})
        })

    }

}