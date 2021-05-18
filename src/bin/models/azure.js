const mongoose = require('mongoose');

const AzureSchema = new mongoose.Schema({
    client_id: { type: String },
    client_secret: { type: String },
    tenant: { type: String },
    resource: { type: String },
    allow_external_users: { type: Boolean, default: false },
    allow_unlicensed_users: { type: Boolean, default: false },
    user_groups: [{ type: String }],
    created_at: { type: Date },
    updated_at: { type: Date }
});

if (global.config.mongo.encKey && global.config.mongo.sigKey) {
    const encrypt = require('mongoose-encryption');
    AzureSchema.plugin(encrypt, { encryptionKey: global.config.mongo.encKey, signingKey: global.config.mongo.sigKey });
}

const Azure = mongoose.model('Azure', AzureSchema);


// Pre save
AzureSchema.pre('save', function(next) {
    const now = new Date();
    this.updated_at = now;
    if (!this.created_at) {
        this.created_at = now;
    }
    next();
});

module.exports = Azure;