const azure = require('azure-storage');

module.exports = async function (context, req) {
    const tableSvc = azure.createTableService(process.env.AzureWebJobsStorage);
    const tableName = "UserActivity";

    tableSvc.createTableIfNotExists(tableName, function(error, result, response) {
        if (error) {
            context.log.error("Error creating table: ", error);
            context.res = {
                status: 500,
                body: "Error creating table"
            };
            context.done();
            return;
        }

        const task = {
            PartitionKey: {'_': req.body.user},
            RowKey: {'_': new Date().toISOString()},
            Email: {'_': req.body.email},
            Message: {'_': req.body.message},
            Timestamp: {'_': new Date()}
        };

        tableSvc.insertEntity(tableName, task, function (error, result, response) {
            if (error) {
                context.log.error("Error inserting entity: ", error);
                context.res = {
                    status: 500,
                    body: "Error logging user activity"
                };
            } else {
                context.res = {
                    status: 200,
                    body: "User activity logged successfully"
                };
            }
            context.done();
        });
    });
};
