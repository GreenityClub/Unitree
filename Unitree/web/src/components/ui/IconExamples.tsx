import React from 'react';
import Card from './Card';
import Icon from './Icon';
import * as icons from '../../utils/icons';

const IconExamples: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Font Awesome 6 Examples</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Solid Icons */}
        <Card title="Solid Icons">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center">
              <Icon icon={icons.userIcon} size="2x" />
              <span className="mt-1 text-sm">User</span>
            </div>
            <div className="flex flex-col items-center">
              <Icon icon={icons.homeIcon} size="2x" />
              <span className="mt-1 text-sm">Home</span>
            </div>
            <div className="flex flex-col items-center">
              <Icon icon={icons.treeIcon} size="2x" color="#15803d" />
              <span className="mt-1 text-sm">Tree</span>
            </div>
            <div className="flex flex-col items-center">
              <Icon icon={icons.leafIcon} size="2x" color="#15803d" />
              <span className="mt-1 text-sm">Leaf</span>
            </div>
            <div className="flex flex-col items-center">
              <Icon icon={icons.settingsIcon} size="2x" />
              <span className="mt-1 text-sm">Settings</span>
            </div>
            <div className="flex flex-col items-center">
              <Icon icon={icons.usersIcon} size="2x" />
              <span className="mt-1 text-sm">Users</span>
            </div>
          </div>
        </Card>
        
        {/* Brand Icons */}
        <Card title="Brand Icons">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center">
              <Icon icon={icons.facebookIcon} size="2x" color="#1877f2" />
              <span className="mt-1 text-sm">Facebook</span>
            </div>
            <div className="flex flex-col items-center">
              <Icon icon={icons.twitterIcon} size="2x" color="#1da1f2" />
              <span className="mt-1 text-sm">Twitter</span>
            </div>
            <div className="flex flex-col items-center">
              <Icon icon={icons.instagramIcon} size="2x" color="#e4405f" />
              <span className="mt-1 text-sm">Instagram</span>
            </div>
            <div className="flex flex-col items-center">
              <Icon icon={icons.githubIcon} size="2x" />
              <span className="mt-1 text-sm">GitHub</span>
            </div>
            <div className="flex flex-col items-center">
              <Icon icon={icons.googleIcon} size="2x" color="#4285f4" />
              <span className="mt-1 text-sm">Google</span>
            </div>
          </div>
        </Card>
        
        {/* Icon Variations */}
        <Card title="Icon Variations">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center">
              <Icon icon={icons.treeIcon} size="2x" spin />
              <span className="mt-1 text-sm">Spinning</span>
            </div>
            <div className="flex flex-col items-center">
              <Icon icon={icons.treeIcon} size="2x" pulse />
              <span className="mt-1 text-sm">Pulse</span>
            </div>
            <div className="flex flex-col items-center">
              <Icon icon={icons.treeIcon} size="2x" border />
              <span className="mt-1 text-sm">Border</span>
            </div>
            <div className="flex flex-col items-center">
              <Icon icon={icons.treeIcon} size="2x" fixedWidth />
              <span className="mt-1 text-sm">Fixed Width</span>
            </div>
            <div className="flex flex-col items-center">
              <Icon icon={icons.treeIcon} size="2x" flip="horizontal" />
              <span className="mt-1 text-sm">Flipped</span>
            </div>
            <div className="flex flex-col items-center">
              <Icon icon={icons.treeIcon} size="2x" rotation={90} />
              <span className="mt-1 text-sm">Rotated</span>
            </div>
          </div>
        </Card>
        
        {/* Icon Sizes */}
        <Card title="Icon Sizes">
          <div className="flex items-end justify-between">
            <div className="flex flex-col items-center">
              <Icon icon={icons.treeIcon} size="xs" />
              <span className="mt-1 text-xs">xs</span>
            </div>
            <div className="flex flex-col items-center">
              <Icon icon={icons.treeIcon} size="sm" />
              <span className="mt-1 text-xs">sm</span>
            </div>
            <div className="flex flex-col items-center">
              <Icon icon={icons.treeIcon} size="lg" />
              <span className="mt-1 text-xs">lg</span>
            </div>
            <div className="flex flex-col items-center">
              <Icon icon={icons.treeIcon} size="2x" />
              <span className="mt-1 text-xs">2x</span>
            </div>
            <div className="flex flex-col items-center">
              <Icon icon={icons.treeIcon} size="3x" />
              <span className="mt-1 text-xs">3x</span>
            </div>
          </div>
        </Card>
        
        {/* Regular Icons */}
        <Card title="Regular Icons">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center">
              <Icon icon={icons.starIcon} size="2x" color="#f59e0b" />
              <span className="mt-1 text-sm">Star</span>
            </div>
            <div className="flex flex-col items-center">
              <Icon icon={icons.bookmarkIcon} size="2x" color="#3b82f6" />
              <span className="mt-1 text-sm">Bookmark</span>
            </div>
          </div>
        </Card>
        
        {/* Common Use Cases */}
        <Card title="Common Use Cases">
          <div className="space-y-4">
            <button className="flex items-center justify-center space-x-2 w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700">
              <Icon icon={icons.saveIcon} />
              <span>Save</span>
            </button>
            
            <div className="flex items-center space-x-2 text-amber-500">
              <Icon icon={icons.warningIcon} />
              <span>Warning message goes here</span>
            </div>
            
            <div className="relative">
              <input 
                type="text" 
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg" 
                placeholder="Search..." 
              />
              <Icon 
                icon={icons.searchIcon} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default IconExamples; 