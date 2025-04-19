import { IsomorphicGitService } from '../services/IsomorphicGitService';
import { XitSettings } from '../types/XitSettings.types';
const LightningFSMock = require('@isomorphic-git/lightning-fs').default;

// Mock external dependencies
jest.mock('isomorphic-git', () => ({
    __esModule: true,
    default: { 
        clone: jest.fn(),
        checkout: jest.fn(),
        fetch: jest.fn(),
        resolveRef: jest.fn().mockResolvedValue('mock-commit-hash'),
        reset: jest.fn(),
        statusMatrix: jest.fn().mockResolvedValue([]),
        add: jest.fn(),
        status: jest.fn().mockResolvedValue('modified'),
        commit: jest.fn(),
        push: jest.fn()
    }
}));

jest.mock('isomorphic-git/http/web', () => ({
    __esModule: true,
    default: {}
}));

// Mock the LightningFS class
const mockFs = {
    promises: {
        readdir: jest.fn(),
        lstat: jest.fn(),
        rm: jest.fn(),
        unlink: jest.fn(),
        mkdir: jest.fn()
    }
};

jest.mock('@isomorphic-git/lightning-fs', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockFs)
}));

// Mock Buffer for testing the browser environment
const originalWindow = { ...global.window };
const mockBuffer = { Buffer: {} };

// Mock settings
const mockSettings: XitSettings = {
    githubToken: 'mock-token',
    repoUrl: 'https://github.com/user/repo.git',
    branchName: 'main',
};

// Mock the buffer module import
const mockBufferImport = jest.fn().mockResolvedValue({ Buffer: mockBuffer.Buffer });
jest.mock('buffer', () => mockBufferImport, { virtual: true });

describe('IsomorphicGitService', () => {
    let service: IsomorphicGitService;
    
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Reset window object before each test
        // Ensure window exists for testing purposes, even if running in Node
        if (typeof global.window === 'undefined') {
            (global as any).window = {};
        }
        delete (window as any).Buffer;

        // Reset the buffer import mock
        mockBufferImport.mockClear();
    });
    
    afterAll(() => {
        // Restore original window object after all tests
        global.window = originalWindow;
    });
    
    describe('build method', () => {
        it('should initialize isomorphic-git and LightningFS', async () => {
            // Create the service instance
            service = new IsomorphicGitService('/mock/path', mockSettings);
            
            // Wait for build to complete (since it's async)
            await (service as any).build();

            // Access private properties using type assertion
            const git = (service as any).git;
            const http = (service as any).http;
            const fs = (service as any).fs;
            
            // Verify dependencies were initialized
            expect(git).toBeDefined();
            expect(http).toBeDefined();
            expect(fs).toBeDefined();
            expect(fs).toBe(mockFs);
        });
        
        it('should not add Buffer polyfill when it already exists', async () => {
            // Mock window with Buffer already defined
            Object.defineProperty(global, 'window', {
                value: { Buffer: mockBuffer.Buffer },
                writable: true,
                configurable: true // Ensure it can be deleted/reconfigured in beforeEach
            });
            
            // Create service which triggers build()
            service = new IsomorphicGitService('/mock/path', mockSettings);
            
            // Wait for build to complete
            await (service as any).build();
            
            // Since Buffer was already defined, the dynamic import should not have happened
            expect(mockBufferImport).not.toHaveBeenCalled();
        });
        
        it('should initialize with correct filesystem name', async () => {
            
            // Create the service
            service = new IsomorphicGitService('/mock/path', mockSettings);
            
            // Wait for build to complete
            await (service as any).build();
            
            // Verify LightningFS was initialized with correct name
            expect(LightningFSMock).toHaveBeenCalledWith('obsidian-git-fs');
        });
    });
    
    // Additional tests could test the authentication configuration
    describe('onAuth method', () => {
        it('should return the correct auth credentials', async () => { // Make test async
            service = new IsomorphicGitService('/mock/path', mockSettings);
            
            // Wait for build to complete before accessing methods
            await (service as any).build();

            // Access private method using type assertion
            const onAuth = (service as any).onAuth();
            
            expect(onAuth).toEqual({
                username: 'x-access-token',
                password: 'mock-token'
            });
        });
    });
});