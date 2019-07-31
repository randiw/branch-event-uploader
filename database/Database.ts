import { DynamoDB, AWSError } from 'aws-sdk'
import { File, ServiceType } from '../model/Models'
import { DocumentClient, QueryOutput } from 'aws-sdk/clients/dynamodb'
import * as AWS from 'aws-sdk'

export class Database {
    dynamoDb: DocumentClient
    downloadTable = process.env.DYNAMODB_TABLE
    
    constructor() {
        AWS.config.update({region: 'us-east-1'})
        this.dynamoDb = new DynamoDB.DocumentClient({
            region: 'us-east-1', 
            endpoint: 'http://localhost:8000'
        })
    }

    saveFiles(files: File[]): Promise<boolean> {
        const { downloadTable, dynamoDb } = this
        return new Promise<boolean>((resolve, reject ) => {
            files.forEach(file => {
                const item = {
                    'downloaded': `${file.downloaded ? '1' : '0'}`,
                    'downloadPath': `${file.downloadPath}`
                }
                dynamoDb.put({
                    TableName: downloadTable,
                    Item: item,
                }, (error, result) => {
                    if (!!error) {
                        reject(error)
                        return
                    }
                    console.debug(`DB Save result: ${JSON.stringify(result)}`)
                    resolve(true)
                })
            })
        })
    }

    listDownloads(): Promise<File[]> {
        const { downloadTable, dynamoDb } = this
        return new Promise<File[]>((resolve, reject) => {
            dynamoDb.scan({
                TableName: downloadTable,
                FilterExpression: "downloaded = :downloaded",
                ExpressionAttributeValues: {
                    ":downloaded" : "0"
                }
            }, (error: AWSError, data: QueryOutput) => {
                if (!!error) {
                    reject(error)
                    return
                }
                if (!data.Items) {
                    resolve([])
                    return
                }
                const files = data.Items.map((item): File => {
                    return itemToFile(item)
                })
                resolve(files)
            })
        })
    }

    getStatus(path: string): Promise<File[]> {
        const { downloadTable, dynamoDb } = this
        return new Promise<File[]>((resolve, reject) => {
            dynamoDb.scan({
                TableName: downloadTable,
                FilterExpression: "downloadPath = :l",
                ExpressionAttributeValues: {
                    ":l" : path
                }
            }, (error: AWSError, data: QueryOutput) => {
                if (!!error) {
                    reject(error)
                    return
                }
                if (!data.Items) {
                    resolve([])
                    return
                }
                const files = data.Items.map(item => {
                    return itemToFile(item)
                })
                resolve(files)
            })
        })
    }
}

function itemToFile(item: any): File {
    return { 
        downloaded : item.downloaded === '1' ? true : false, 
        downloadPath: item.downloadPath as string,
        pathAvailable: true, //TODO: Fix for Tune
        type: ServiceType.Branch //TODO: Fix for Tune
    }
}