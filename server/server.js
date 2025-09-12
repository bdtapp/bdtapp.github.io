const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { type } = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from public directory

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bostondogtor';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Pet Schema
const petSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: false
    },
    owner: {
        type: String,
        required: true,
        trim: false
    },
    age: {
        type: Number,
        required: true,
        min: 0,
        max: 30
    },
    sex: {
        type: String,
        required: true,
        enum: ['m', 'f']
    },
    fixed: {
        type: Boolean,
        required: true
    },
    active: {
        type: Boolean,
        default: false
    },
    datecreated: {
        type: Date,
        default: Date.now
    }
});

// Fixed typo in schema name and updated structure
const activePetSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: false
    },
    owner: {
        type: String,
        required: true,
        trim: false
    },
    age: {
        type: Number,
        required: true
    },
    sex: {
        type: String,
        required: true,
        enum: ['m', 'f']
    },
    fixed: {
        type: Boolean,
        required: true
    },
    out: {
        type: Boolean,
        default: false
    },
    fed: {
        type: Boolean,
        default: false
    },
    currentlyOut: {
        type: Boolean,
        default: false
    },
    cleared: {
        type: Boolean,
        default: false
    },
    dateActivated: {
        type: Date,
        default: Date.now
    },

});

const Pet = mongoose.model('Pet', petSchema);
const ActivePet = mongoose.model('activepets', activePetSchema);

// Routes

// Get all pets
app.get('/api/pets', async (req, res) => {
    try {
        const pets = await Pet.find().sort({ datecreated: -1 });
        res.json(pets);
    } catch (error) {
        console.error('Error fetching pets:', error);
        res.status(500).json({ error: 'Failed to fetch pets' });
    }
});

// Get active pets (from the active collection)
app.get('/api/pets/active', async (req, res) => {
    try {
        const activePets = await ActivePet.find().sort({ dateActivated: -1 });
        res.json(activePets);
    } catch (error) {
        console.error('Error fetching active pets:', error);
        res.status(500).json({ error: 'Failed to fetch active pets' });
    }
});

// Get inactive pets
app.get('/api/pets/inactive', async (req, res) => {
    try {
        const inactivePets = await Pet.find({ active: false }).sort({ datecreated: -1 });
        res.json(inactivePets);
    } catch (error) {
        console.error('Error fetching inactive pets:', error);
        res.status(500).json({ error: 'Failed to fetch inactive pets' });
    }
});

// Create new pet
app.post('/api/pets', async (req, res) => {
    try {
        const { name, owner, age, sex, fixed } = req.body;

        // Validation
        if (!name || !owner || age === undefined || !sex || fixed === undefined) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (age < 0 || age > 30) {
            return res.status(400).json({ error: 'Age must be between 0 and 30 years' });
        }

        if (!['m', 'f'].includes(sex)) {
            return res.status(400).json({ error: 'Sex must be "m" or "f"' });
        }

        // Create new pet
        const newPet = new Pet({
            name: name,
            owner: owner,
            age: parseInt(age),
            sex,
            fixed: Boolean(fixed),
            active: false
        });

        const savedPet = await newPet.save();
        res.status(201).json(savedPet);

    } catch (error) {
        console.error('Error creating pet:', error);
        if (error.name === 'ValidationError') {
            res.status(400).json({ error: 'Validation error: ' + error.message });
        } else {
            res.status(500).json({ error: 'Failed to create pet profile' });
        }
    }
});

// Update pet (edit pet information)
app.put('/api/pets/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, owner, age, sex, fixed } = req.body;

        // Validation
        if (!name || !owner || age === undefined || !sex || fixed === undefined) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (age < 0 || age > 30) {
            return res.status(400).json({ error: 'Age must be between 0 and 30 years' });
        }

        if (!['m', 'f'].includes(sex)) {
            return res.status(400).json({ error: 'Sex must be "m" or "f"' });
        }

        const updatedPet = await Pet.findByIdAndUpdate(
            id,
            {
                name: name,
                owner: owner,
                age: parseInt(age),
                sex,
                fixed: Boolean(fixed)
            },
            { new: true }
        );

        if (!updatedPet) {
            return res.status(404).json({ error: 'Pet not found' });
        }

        // If the pet is currently active, also update the active collection
        if (updatedPet.active) {
            await ActivePet.findByIdAndUpdate(
                id,
                {
                    name: name,
                    owner: owner,
                    age: parseInt(age),
                    sex,
                    fixed: Boolean(fixed)
                },
                { new: true }
            );
        }

        res.json(updatedPet);
    } catch (error) {
        console.error('Error updating pet:', error);
        if (error.name === 'ValidationError') {
            res.status(400).json({ error: 'Validation error: ' + error.message });
        } else {
            res.status(500).json({ error: 'Failed to update pet' });
        }
    }
});

// Update pet status (set active/inactive)
app.patch('/api/pets/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { active } = req.body;
        const isActive = Boolean(active);

        // Get the current pet data
        const currentPet = await Pet.findById(id);
        if (!currentPet) {
            return res.status(404).json({ error: 'Pet not found' });
        }

        // Update the pet's active status
        const updatedPet = await Pet.findByIdAndUpdate(
            id,
            { active: isActive },
            { new: true }
        );

        if (isActive) {
            // Setting to active - add to active collection with same ID
            const activePetData = {
                _id: currentPet._id, // Use the same ID
                name: currentPet.name,
                owner: currentPet.owner,
                age: currentPet.age,
                sex: currentPet.sex,
                fixed: currentPet.fixed,
                out: false,
                fed: false,
                currentlyOut: false,
                cleared: false,
                dateActivated: new Date()
            };

            // Check if already exists in active collection
            const existingActivePet = await ActivePet.findById(id);
            if (existingActivePet) {
                // Update existing active pet
                await ActivePet.findByIdAndUpdate(id, activePetData);
                console.log(`Updated existing active pet ${currentPet.name} (${id})`);
            } else {
                // Create new active pet
                const newActivePet = new ActivePet(activePetData);
                await newActivePet.save();
                console.log(`Added pet ${currentPet.name} (${id}) to active collection`);
            }
        } else {
            // Setting to inactive - remove from active collection
            const removedActivePet = await ActivePet.findByIdAndDelete(id);
            if (removedActivePet) {
                console.log(`Removed pet ${currentPet.name} (${id}) from active collection`);
            }
        }

        res.json(updatedPet);
    } catch (error) {
        console.error('Error updating pet status:', error);
        res.status(500).json({ error: 'Failed to update pet status' });
    }
});

// Delete pet
app.delete('/api/pets/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Delete from both collections
        const deletedPet = await Pet.findByIdAndDelete(id);
        await ActivePet.findByIdAndDelete(id); // Remove from active collection if it exists

        if (!deletedPet) {
            return res.status(404).json({ error: 'Pet not found' });
        }

        console.log(`Deleted pet ${deletedPet.name} (${id}) from both collections`);
        res.json({ message: 'Pet deleted successfully' });
    } catch (error) {
        console.error('Error deleting pet:', error);
        res.status(500).json({ error: 'Failed to delete pet' });
    }
});

// Additional routes for managing active pets

// Update active pet status (out, fed, currentlyOut, cleared, currentlyouttimestamp)
app.patch('/api/active-pets/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Only allow updating specific fields
        const allowedFields = ['out', 'fed', 'currentlyOut', 'cleared', 'currentlyouttimestamp'];
        const filteredUpdate = {};
        
        Object.keys(updateData).forEach(key => {
            if (allowedFields.includes(key)) {
                if (key === 'currentlyouttimestamp') {
                    // Handle timestamp - can be null, number, or Date
                    filteredUpdate[key] = updateData[key] ? new Date(updateData[key]) : null;
                } else {
                    filteredUpdate[key] = Boolean(updateData[key]);
                }
            }
        });

        const updatedActivePet = await ActivePet.findByIdAndUpdate(
            id,
            filteredUpdate,
            { new: true }
        );

        if (!updatedActivePet) {
            return res.status(404).json({ error: 'Active pet not found' });
        }

        console.log(`Updated active pet ${updatedActivePet.name} (${id}):`, filteredUpdate);
        res.json(updatedActivePet);
    } catch (error) {
        console.error('Error updating active pet:', error);
        res.status(500).json({ error: 'Failed to update active pet' });
    }
});

// Get single active pet by ID
app.get('/api/active-pets/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const activePet = await ActivePet.findById(id);
        
        if (!activePet) {
            return res.status(404).json({ error: 'Active pet not found' });
        }
        
        res.json(activePet);
    } catch (error) {
        console.error('Error fetching active pet:', error);
        res.status(500).json({ error: 'Failed to fetch active pet' });
    }
});

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'createnew.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});