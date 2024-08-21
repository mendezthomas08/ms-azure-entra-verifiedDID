/**
 * @swagger
 * /api/issuer/verifiableCredentials/authorities/:authorityId/contracts:
 * 
 *   get:
 *     summary: Get a list of contracts
 *     description: Retrieve a list of contracts.
 *     tags:
 *       - Issuer
 *     parameters:
 *       - name: authorityId
 *         in: path
 *         required: true
 *         description: The id of the authority.
 *         schema:
 *           type: string 
 *     responses:
 *       200:
 *         description: Successful response with contract list
 *       500:
 *         description: Internal server error
 */