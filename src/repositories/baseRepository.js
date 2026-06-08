// src/repositories/baseRepository.js

class BaseRepository {
    constructor(model) {
        this.model = model;
    }

    /**
     * အသစ်ဖန်တီးခြင်း
     * @param {Object} data - ဖန်တီးမည့်အချက်အလက်
     * @returns {Object} ဖန်တီးပြီးသားအချက်အလက်
     */
    async create(data) {
        // ✅ ဒီနည်းက pre-save middleware ကို trigger လုပ်မယ်
        const document = new this.model(data);
        return await document.save();
        
        // ❌ ဒီနည်းကိုတော့ မသုံးပါနဲ့ (password hash မဖြစ်ဘူး)
        // return await this.model.create(data);
    }

    // ကျန်တဲ့ method တွေ အတိုင်းသုံးလို့ရပါတယ်...
    async findById(id) {
        return await this.model.findById(id);
    }

    async findAll(filter = {}, options = {}) {
        let query = this.model.find(filter);
        
        if (options.sort) {
            query = query.sort(options.sort);
        }
        if (options.limit) {
            query = query.limit(options.limit);
        }
        if (options.skip) {
            query = query.skip(options.skip);
        }
        if (options.select) {
            query = query.select(options.select);
        }
        if (options.populate) {
            query = query.populate(options.populate);
        }
        
        return await query;
    }

    async findOne(filter) {
        return await this.model.findOne(filter);
    }

    async updateById(id, data) {
        return await this.model.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        });
    }

    async updateOne(filter, data) {
        return await this.model.findOneAndUpdate(filter, data, {
            new: true,
            runValidators: true
        });
    }

    async deleteById(id) {
        return await this.model.findByIdAndDelete(id);
    }

    async deleteOne(filter) {
        return await this.model.findOneAndDelete(filter);
    }

    async count(filter = {}) {
        return await this.model.countDocuments(filter);
    }

    async exists(filter) {
        return await this.model.exists(filter);
    }
}

module.exports = BaseRepository;