"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CORE_KNOWLEDGE = void 0;
exports.createEmbedding = createEmbedding;
exports.cosineSimilarity = cosineSimilarity;
exports.searchKnowledgeBase = searchKnowledgeBase;
exports.getRelevantKnowledge = getRelevantKnowledge;
var openai_1 = require("openai");
var prisma_1 = require("./prisma");
// Lazy initialization of OpenAI client
var openai = null;
function getOpenAIClient() {
    if (!openai) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OpenAI API key not configured');
        }
        openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openai;
}
// Ultra-conservative token estimation for embedding validation
function estimateTokensForEmbedding(text) {
    // ULTRA conservative - based on actual failure at 11,312 tokens from ~16,000 chars
    // That's about 1.4 chars per token - using 1.2 to be extra safe
    return Math.ceil(text.length / 1.2);
}
// Create embeddings for text content with AGGRESSIVE validation
function createEmbedding(text) {
    return __awaiter(this, void 0, void 0, function () {
        var estimatedTokens, maxTokens, maxChars, client, response, embedding, error_1;
        var _a, _b, _c, _d, _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    _g.trys.push([0, 2, , 3]);
                    console.log("DEBUG EMBEDDING: Starting embedding creation for text length: ".concat(text.length, " characters"));
                    console.log("DEBUG EMBEDDING: First 200 chars: ".concat(text.substring(0, 200)));
                    // AGGRESSIVE character limit first - based on actual failure patterns
                    if (text.length > 8000) {
                        console.warn("DEBUG EMBEDDING: EMERGENCY TRUNCATION: Text too long (".concat(text.length, " chars), truncating to 8000 chars"));
                        text = text.substring(0, 8000);
                        console.log("DEBUG EMBEDDING: Text truncated to ".concat(text.length, " characters"));
                    }
                    estimatedTokens = estimateTokensForEmbedding(text);
                    console.log("DEBUG EMBEDDING: Estimated tokens: ".concat(estimatedTokens));
                    maxTokens = 6000 // Much more aggressive limit
                    ;
                    if (estimatedTokens > maxTokens) {
                        console.warn("DEBUG EMBEDDING: EMERGENCY TOKEN TRUNCATION: ".concat(estimatedTokens, " estimated tokens > ").concat(maxTokens, ", applying emergency truncation"));
                        maxChars = maxTokens * 1.2 // Ultra conservative
                        ;
                        text = text.substring(0, maxChars);
                        console.log("DEBUG EMBEDDING: Emergency token truncation: reduced to ".concat(text.length, " characters"));
                    }
                    console.log("DEBUG EMBEDDING: Final text stats before API call:", {
                        length: text.length,
                        estimatedTokens: estimateTokensForEmbedding(text),
                        firstWords: text.split(' ').slice(0, 10).join(' '),
                        hasNonAscii: /[^\x00-\x7F]/.test(text)
                    });
                    console.log("DEBUG EMBEDDING: Getting OpenAI client...");
                    client = getOpenAIClient();
                    console.log("DEBUG EMBEDDING: OpenAI client obtained, making API call...");
                    return [4 /*yield*/, client.embeddings.create({
                            model: 'text-embedding-3-small',
                            input: text,
                        })];
                case 1:
                    response = _g.sent();
                    console.log("DEBUG EMBEDDING: API call successful, processing response...");
                    console.log("DEBUG EMBEDDING: Response structure:", {
                        hasData: !!response.data,
                        dataLength: ((_a = response.data) === null || _a === void 0 ? void 0 : _a.length) || 0,
                        hasFirstEmbedding: !!((_b = response.data) === null || _b === void 0 ? void 0 : _b[0]),
                        embeddingLength: ((_e = (_d = (_c = response.data) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.embedding) === null || _e === void 0 ? void 0 : _e.length) || 0,
                        usage: response.usage
                    });
                    embedding = response.data[0].embedding;
                    console.log("DEBUG EMBEDDING: Embedding extraction successful:", {
                        embeddingLength: embedding.length,
                        firstValues: embedding.slice(0, 5),
                        lastValues: embedding.slice(-5)
                    });
                    return [2 /*return*/, embedding];
                case 2:
                    error_1 = _g.sent();
                    console.error('DEBUG EMBEDDING: Error creating embedding with full details:', {
                        errorType: ((_f = error_1 === null || error_1 === void 0 ? void 0 : error_1.constructor) === null || _f === void 0 ? void 0 : _f.name) || 'Unknown',
                        errorMessage: error_1 instanceof Error ? error_1.message : String(error_1),
                        errorStack: error_1 instanceof Error ? error_1.stack : undefined,
                        stringifiedError: JSON.stringify(error_1, Object.getOwnPropertyNames(error_1)),
                        textLength: text.length,
                        estimatedTokens: estimateTokensForEmbedding(text),
                        textPreview: text.substring(0, 100),
                        hasApiKey: !!process.env.OPENAI_API_KEY
                    });
                    // Create more specific error messages
                    if (error_1 instanceof Error) {
                        if (error_1.message.includes('429')) {
                            throw new Error("OpenAI API rate limit exceeded: ".concat(error_1.message));
                        }
                        else if (error_1.message.includes('401') || error_1.message.includes('authentication')) {
                            throw new Error("OpenAI API authentication failed: ".concat(error_1.message));
                        }
                        else if (error_1.message.includes('400')) {
                            throw new Error("OpenAI API bad request: ".concat(error_1.message));
                        }
                        else if (error_1.message.includes('timeout') || error_1.message.includes('ETIMEDOUT')) {
                            throw new Error("OpenAI API timeout: ".concat(error_1.message));
                        }
                        else if (error_1.message.includes('network') || error_1.message.includes('ENOTFOUND')) {
                            throw new Error("Network error calling OpenAI API: ".concat(error_1.message));
                        }
                    }
                    throw error_1;
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Calculate cosine similarity between two vectors
function cosineSimilarity(a, b) {
    if (a.length !== b.length) {
        throw new Error('Vectors must have the same length');
    }
    var dotProduct = 0;
    var normA = 0;
    var normB = 0;
    for (var i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
// Enhanced search function that includes uploaded documents from database
function searchKnowledgeBase(query_1) {
    return __awaiter(this, arguments, void 0, function (query, limit) {
        var queryEmbedding_1, briefs, knowledgeDocs, briefDocuments, _i, briefs_1, brief, briefEmbedding, similarity, uploadedKnowledgeDocs, allDocuments, error_2;
        if (limit === void 0) { limit = 3; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 8, , 9]);
                    // Check if OpenAI is available
                    if (!process.env.OPENAI_API_KEY) {
                        console.warn('OpenAI API key not configured, returning empty results');
                        return [2 /*return*/, []];
                    }
                    return [4 /*yield*/, createEmbedding(query)
                        // Get briefs from database for semantic search
                    ];
                case 1:
                    queryEmbedding_1 = _a.sent();
                    return [4 /*yield*/, prisma_1.prisma.brief.findMany({
                            where: { isPublished: true },
                            select: {
                                id: true,
                                title: true,
                                content: true,
                                slug: true,
                                description: true,
                            }
                        })
                        // Get uploaded knowledge documents from database using raw SQL query
                    ];
                case 2:
                    briefs = _a.sent();
                    return [4 /*yield*/, prisma_1.prisma.$queryRaw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      SELECT id, title, content, category, tags, embedding, \"documentType\", \"fileName\", \"createdAt\"\n      FROM \"knowledge_documents\"\n      LIMIT 100\n    "], ["\n      SELECT id, title, content, category, tags, embedding, \"documentType\", \"fileName\", \"createdAt\"\n      FROM \"knowledge_documents\"\n      LIMIT 100\n    "])))];
                case 3:
                    knowledgeDocs = _a.sent();
                    briefDocuments = [];
                    _i = 0, briefs_1 = briefs;
                    _a.label = 4;
                case 4:
                    if (!(_i < briefs_1.length)) return [3 /*break*/, 7];
                    brief = briefs_1[_i];
                    return [4 /*yield*/, createEmbedding(brief.content)
                        // Calculate similarity
                    ];
                case 5:
                    briefEmbedding = _a.sent();
                    similarity = cosineSimilarity(queryEmbedding_1, briefEmbedding);
                    briefDocuments.push({
                        id: brief.id,
                        title: brief.title,
                        content: brief.content,
                        category: 'legal-brief',
                        tags: ['thai-property-law'],
                        embedding: briefEmbedding,
                        similarity: similarity,
                        documentType: 'MANUAL'
                    });
                    _a.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 4];
                case 7:
                    uploadedKnowledgeDocs = knowledgeDocs.map(function (doc) {
                        var similarity = calculateCosineSimilarity(queryEmbedding_1, doc.embedding);
                        return {
                            id: doc.id,
                            title: doc.title,
                            content: doc.content,
                            category: doc.category,
                            tags: doc.tags,
                            embedding: doc.embedding,
                            similarity: similarity,
                            documentType: doc.documentType,
                            fileName: doc.fileName
                        };
                    });
                    allDocuments = __spreadArray(__spreadArray([], briefDocuments, true), uploadedKnowledgeDocs, true);
                    // Sort by similarity and return top results
                    return [2 /*return*/, allDocuments
                            .sort(function (a, b) { return (b.similarity || 0) - (a.similarity || 0); })
                            .slice(0, limit)];
                case 8:
                    error_2 = _a.sent();
                    console.error('Error searching knowledge base:', error_2);
                    // Return empty array if search fails
                    return [2 /*return*/, []];
                case 9: return [2 /*return*/];
            }
        });
    });
}
// Calculate cosine similarity between two vectors
function calculateCosineSimilarity(a, b) {
    if (a.length !== b.length) {
        return 0;
    }
    var dotProduct = 0;
    var normA = 0;
    var normB = 0;
    for (var i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    var norm = Math.sqrt(normA) * Math.sqrt(normB);
    return norm === 0 ? 0 : dotProduct / norm;
}
// Pre-built knowledge for common Thai property law topics
exports.CORE_KNOWLEDGE = {
    "foreign-ownership": {
        title: "Foreign Property Ownership in Thailand",
        content: "\nForeign nationals face specific restrictions when owning property in Thailand:\n\nLAND OWNERSHIP:\n- Foreign nationals cannot directly own land in Thailand\n- Maximum 49% foreign ownership in any land holding company\n- Strict regulations on nominee arrangements\n\nCONDOMINIUM OWNERSHIP:\n- Foreigners can own up to 49% of units in a condominium project\n- Must transfer funds from abroad with proper documentation\n- Need Foreign Exchange Transaction Form (FETF)\n\nCOMPANY STRUCTURE:\n- Some buyers use Thai limited companies to hold land\n- Requires majority Thai ownership (51%)\n- Must have legitimate business purpose\n- Regular compliance requirements\n\nLEGAL REQUIREMENTS:\n- All funds must be transferred from abroad\n- Proper visa and documentation required\n- Due diligence on property title essential\n- Use qualified Thai lawyer for transactions\n    ",
        category: "foreign-ownership",
        tags: ["foreign-buyers", "land-ownership", "condominiums", "company-structure"]
    },
    "trust-ownership-model": {
        title: "Bespoke Trust Property Ownership Model",
        content: "\nOur proprietary trust ownership model provides a secure structure for foreign property ownership in Thailand:\n\nTRUST STRUCTURE BENEFITS:\n- Legal compliance with Thai foreign ownership laws\n- Enhanced asset protection and security\n- Professional management and oversight\n- Simplified succession planning\n\nHOW IT WORKS:\n- Property held in trust by qualified Thai entity\n- Foreign beneficiary retains beneficial ownership\n- Transparent governance and reporting\n- Exit strategies and transfer mechanisms built-in\n\nLEGAL FRAMEWORK:\n- Structured to comply with Thai Civil and Commercial Code\n- Regular legal reviews and compliance updates\n- Professional trustees with local expertise\n- Insurance and indemnity protections\n\nADVANTAGES OVER TRADITIONAL METHODS:\n- More secure than nominee arrangements\n- Better protection than company structures\n- Professional management reduces risks\n- Simplified compliance requirements\n\nINVESTMENT PROTECTION:\n- Multiple layers of legal protection\n- Professional oversight and governance\n- Regular audits and reporting\n- Clear exit and transfer procedures\n    ",
        category: "trust-ownership",
        tags: ["trust-structure", "foreign-ownership", "asset-protection", "bespoke-model"]
    },
    "tax-obligations": {
        title: "Thai Property Tax Obligations",
        content: "\nUnderstanding tax implications is crucial for property owners in Thailand:\n\nTRANSFER TAXES:\n- Specific Business Tax (SBT): 3.3% for properties sold within 5 years\n- Transfer Fee: 2% of appraised value\n- Stamp Duty: 0.5% (alternative to SBT for properties held >5 years)\n- Withholding Tax: Progressive rates for individuals\n\nONGOING TAXES:\n- Annual Property Tax: 0.02% to 0.1% of appraised value\n- Rental Income Tax: Progressive rates from 5% to 35%\n- Corporate Tax: 20% for company-owned properties\n\nTAX PLANNING STRATEGIES:\n- Hold properties for more than 5 years to avoid SBT\n- Use appropriate ownership structures for tax efficiency\n- Claim allowable deductions for rental properties\n- Utilize double taxation treaties where applicable\n\nCOMPLIANCE REQUIREMENTS:\n- Annual tax filings required\n- Proper documentation of all transactions\n- Regular property valuations\n- Professional tax advice recommended\n    ",
        category: "tax-obligations",
        tags: ["property-tax", "transfer-tax", "rental-income", "tax-planning"]
    }
};
// Enhanced function to get relevant knowledge including uploaded PDFs
function getRelevantKnowledge(query, userRole) {
    return __awaiter(this, void 0, void 0, function () {
        var searchResults, _a, coreKnowledge, queryLower, isAccountant, isLawyer, coreMatches, contextContent_1, error_3;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 4, , 5]);
                    console.log('DEBUG KNOWLEDGE: Starting knowledge retrieval for query:', query);
                    console.log('DEBUG KNOWLEDGE: User role:', userRole);
                    if (!process.env.OPENAI_API_KEY) return [3 /*break*/, 2];
                    return [4 /*yield*/, searchKnowledgeBase(query, 3)];
                case 1:
                    _a = _b.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _a = [];
                    _b.label = 3;
                case 3:
                    searchResults = _a;
                    console.log('DEBUG KNOWLEDGE: Search results from uploaded documents:', {
                        count: searchResults.length,
                        documents: searchResults.map(function (doc) { return ({ title: doc.title, similarity: doc.similarity }); })
                    });
                    coreKnowledge = "";
                    queryLower = query.toLowerCase();
                    console.log('DEBUG KNOWLEDGE: Checking core knowledge patterns for query:', queryLower);
                    isAccountant = userRole === 'ACCOUNTANT';
                    isLawyer = userRole === 'LAWYER';
                    coreMatches = [];
                    if (queryLower.includes("foreign") || queryLower.includes("ownership")) {
                        coreKnowledge += exports.CORE_KNOWLEDGE["foreign-ownership"].content + "\n\n";
                        coreMatches.push('foreign-ownership');
                        console.log('DEBUG KNOWLEDGE: Added foreign-ownership core knowledge');
                    }
                    if (queryLower.includes("trust") || queryLower.includes("bespoke")) {
                        coreKnowledge += exports.CORE_KNOWLEDGE["trust-ownership-model"].content + "\n\n";
                        coreMatches.push('trust-ownership-model');
                        console.log('DEBUG KNOWLEDGE: Added trust-ownership-model core knowledge');
                    }
                    if (queryLower.includes("tax") || queryLower.includes("duty") || isAccountant) {
                        coreKnowledge += exports.CORE_KNOWLEDGE["tax-obligations"].content + "\n\n";
                        coreMatches.push('tax-obligations');
                        console.log('DEBUG KNOWLEDGE: Added tax-obligations core knowledge (tax/duty match or accountant role)');
                    }
                    // Lawyers get comprehensive coverage
                    if (isLawyer && !coreKnowledge) {
                        coreKnowledge += exports.CORE_KNOWLEDGE["foreign-ownership"].content + "\n\n";
                        coreKnowledge += exports.CORE_KNOWLEDGE["trust-ownership-model"].content + "\n\n";
                        coreMatches.push('foreign-ownership', 'trust-ownership-model');
                        console.log('DEBUG KNOWLEDGE: Added comprehensive core knowledge for lawyer role');
                    }
                    console.log('DEBUG KNOWLEDGE: Core knowledge analysis:', {
                        queryKeywords: queryLower.split(' ').filter(function (word) { return word.length > 3; }),
                        coreMatches: coreMatches,
                        hasCoreKnowledge: !!coreKnowledge,
                        coreKnowledgeLength: coreKnowledge.length,
                        userRole: userRole,
                        isAccountant: isAccountant,
                        isLawyer: isLawyer
                    });
                    contextContent_1 = "";
                    if (coreKnowledge) {
                        contextContent_1 += "RELEVANT KNOWLEDGE BASE:\n" + coreKnowledge;
                        console.log('DEBUG KNOWLEDGE: Including core knowledge in context');
                    }
                    else {
                        console.log('DEBUG KNOWLEDGE: No core knowledge patterns matched');
                    }
                    if (searchResults.length > 0) {
                        contextContent_1 += "RELEVANT DOCUMENTS:\n";
                        searchResults.forEach(function (doc) {
                            var sourceType = doc.documentType === 'PDF' ? 'PDF Document' :
                                doc.documentType === 'MANUAL' ? 'Legal Brief' : 'Document';
                            contextContent_1 += "\n--- ".concat(doc.title, " (").concat(sourceType, ") ---\n").concat(doc.content, "\n");
                        });
                        console.log('DEBUG KNOWLEDGE: Including uploaded documents in context');
                    }
                    else {
                        console.log('DEBUG KNOWLEDGE: No uploaded documents found matching query');
                    }
                    console.log('DEBUG KNOWLEDGE: Final context summary:', {
                        totalContextLength: contextContent_1.length,
                        hasCoreKnowledge: !!coreKnowledge,
                        hasUploadedDocs: searchResults.length > 0,
                        coreMatches: coreMatches,
                        uploadedDocsCount: searchResults.length
                    });
                    return [2 /*return*/, contextContent_1];
                case 4:
                    error_3 = _b.sent();
                    console.error('DEBUG KNOWLEDGE: Error getting relevant knowledge:', {
                        error: error_3 instanceof Error ? error_3.message : error_3,
                        stack: error_3 instanceof Error ? error_3.stack : undefined,
                        query: query,
                        userRole: userRole
                    });
                    return [2 /*return*/, ""];
                case 5: return [2 /*return*/];
            }
        });
    });
}
var templateObject_1;
