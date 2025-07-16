# Tree Types Feature

This document explains the new tree species/types functionality added to the Unitree application.

## Overview

The tree types feature allows users to select from different tree species when redeeming points for trees. Each tree species has its own characteristics including:

- **Name**: Display name of the tree
- **Scientific Name**: Latin/scientific name
- **Description**: Detailed description of the tree
- **Care Level**: How difficult it is to care for (Easy, Moderate, Hard)
- **Max Height**: Maximum height the tree can reach
- **Lifespan**: How long the tree typically lives
- **Native To**: Geographic region where the tree is native
- **Cost**: Points required to redeem this tree species
- **Stages**: Growth stages of the tree
- **isActive**: Whether this tree type is available for redemption

## Database Setup

### 1. TreeType Model

A new MongoDB model `TreeType` has been created at `src/models/TreeType.js` that matches the structure of your treetypes collection.

### 2. Seeding Data

To populate your database with tree types:

```bash
# Navigate to server directory
cd Unitree/server

# Run the seed script
npm run seed-tree-types
```

This will:
- Connect to your MongoDB database
- Clear existing tree types
- Insert sample tree types (Oak, Maple, Pine, Cherry Blossom, Weeping Willow)

### 3. Manual Data Entry

You can also manually add tree types to your MongoDB treetypes collection using the structure:

```javascript
{
  id: "unique_tree_id",
  name: "Tree Name",
  scientificName: "Scientific Name",
  description: "Tree description",
  careLevel: "Easy|Moderate|Hard",
  maxHeight: "height range",
  lifespan: "lifespan info",
  nativeTo: "native region",
  cost: 100, // points cost
  stages: ["stage01", "stage02", "stage03", "stage04", "stage05", "stage06"],
  isActive: true
}
```

## API Endpoints

### Get All Tree Species
```
GET /api/trees/species
```
Returns all active tree species with full details.

### Get Tree Species by ID
```
GET /api/trees/species/:id
```
Returns a specific tree species by its ID.

### Legacy Tree Types Endpoint
```
GET /api/trees/types
```
Returns simple array of species names (for backward compatibility).

## Mobile App Integration

The mobile app has been updated to:

1. **Fetch Tree Species**: Uses the new `/api/trees/species` endpoint
2. **Dynamic Pricing**: Shows the actual cost of trees based on species data
3. **Rich Information**: Displays detailed tree information including scientific name, care level, lifespan, etc.
4. **Smart Validation**: Only shows affordable tree species based on user points
5. **Enhanced UI**: Updated the redeem button and modal to show dynamic pricing and species count

## Usage Flow

1. User taps "Plant Tree" button on Points screen
2. App loads available tree species from the API
3. App filters species user can afford
4. Shows detailed information about the selected species
5. User confirms and redeems the tree
6. Points are deducted based on the species cost
7. Tree is created with the selected species information

## Customization

You can customize the tree types by:

1. **Adding New Species**: Insert new documents into the treetypes collection
2. **Updating Costs**: Modify the `cost` field for different pricing
3. **Seasonal Availability**: Use the `isActive` field to enable/disable species
4. **Custom Stages**: Modify the `stages` array for different growth stages

## Development

When developing locally:

1. Make sure your MongoDB connection is configured in `.env`
2. Run the seed script to populate tree types
3. The server will automatically serve the new tree species endpoints
4. The mobile app will use the new species selection flow

## Troubleshooting

- **No trees available**: Check that tree types exist in the database and `isActive` is true
- **Species not loading**: Verify the API endpoints are working and the TreeType model is properly exported
- **Cost validation errors**: Ensure the `cost` field is a positive number in the database 