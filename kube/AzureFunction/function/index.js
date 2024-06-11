const azure = require('azure-storage');

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const tableSvc = azure.createTableService(process.env.AzureWebJobsStorage);
    const tableName = "UserActivity";

    tableSvc.createTableIfNotExists(tableName, function (error, result, response) {
        if (error) {
            context.log('Error creating table:', error);
            context.res = {
                status: 500,
                body: "Error creating table"
            };
            context.done();
            return;
        }

        const task = {
            PartitionKey: { '_': req.body.user },
            RowKey: { '_': new Date().toISOString() },
            Email: { '_': req.body.email },
            Message: { '_': req.body.message },
            Timestamp: { '_': new Date() }
        };

        context.log('Inserting entity:', task);

        tableSvc.insertEntity(tableName, task, function (error, result, response) {
            if (!error) {
                context.res = {
                    status: 200,
                    body: "User activity logged successfully"
                };
            } else {
                context.log('Error inserting entity:', error);
                context.res = {
                    status: 500,
                    body: "Error logging user activity"
                };
            }
            context.done();
        });
    });
};
