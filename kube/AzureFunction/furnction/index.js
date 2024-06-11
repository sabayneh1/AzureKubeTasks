const azure = require('azure-storage');

module.exports = async function (context, req) {
    const tableSvc = azure.createTableService(process.env.AzureWebJobsStorage);
    const tableName = "UserActivity";

    tableSvc.createTableIfNotExists(tableName, function(error, result, response) {
        if (!error) {
            const task = {
                PartitionKey: {'_': req.body.user},
                RowKey: {'_': new Date().toISOString()},
                Email: {'_': req.body.email},
                Message: {'_': req.body.message},
                Timestamp: {'_': new Date()}
            };

            tableSvc.insertEntity(tableName, task, function (error, result, response) {
                if (!error) {
                    context.res = {
                        status: 200,
                        body: "User activity logged successfully"
                    };
                } else {
                    context.res = {
                        status: 500,
                        body: "Error logging user activity"
                    };
                }
                context.done();
            });
        }
    });
};
